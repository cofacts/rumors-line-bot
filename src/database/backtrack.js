import UserSettings from './models/userSettings';
import UserArticleLink from './models/userArticleLink';
import { parseToJson } from '@cofacts/line-bot-log-parser';

/**
 * Usage:
 *
 * 1. Prepare the rumors-line-bot-logs folder, and its structure should be like below.
 * ```
 * rumors-line-bot-logs $ tree
 * .
 * ├── 201705
 * │   ├── 23
 * │   │   ├── 00
 * │   │   │   ├── 0009.70036095121560.log
 * │   │   │   ├── 0021.70036095121560.log
 * │   │   │   ├── 0035.70036095121560.log
 * │   │   │   ├── 0058.70036095121560.log
 * │   │   │   ├── 0114.70036095121560.log
 * │   │   │   ├── 0125.70036095121560.log
 * │   │   │   ├── 0200.70036095121560.log
 * │   │   │   [...]
 * │   │   ├── 01
 * │   │   │   [...]
 * │   │   ├── 02
 * │   │   │   [...]
 * │   │   ├── 03
 * ```
 *
 * 2. run
 * ```bash
 * USER_ID=1 node_modules/.bin/babel-node -r dotenv/config src/database/backtrack.js
 * ```
 *
 * @param {string} path a path of rumors-line-bot-logs folder
 *
 */

async function main(logFilePath) {
  const parse = async path => {
    const status = {
      processedLog: 0,
      writtenUserSettings: 0,
      writtenUserArticleLink: 0,
    };

    await parseToJson(path, async (data, next) => {
      const timestamp = new Date(data['timestamp']);
      const userId = data['userId'];
      const selectedArticleId = data['context.data.selectedArticleId'];

      status.processedLog++;
      if (userId) {
        await UserSettings.findOrInsertByUserId(userId);
        status.writtenUserSettings++;

        if (selectedArticleId) {
          await UserArticleLink.createOrUpdateByUserIdAndArticleId(
            userId,
            selectedArticleId,
            {
              lastViewedAt: timestamp,
            }
          );
          status.writtenUserArticleLink++;
        }
      }

      if (status.processedLog % 1000 === 0) {
        console.log(status);
      }

      next();
    });

    console.log(status);
  };

  for (let y = 2017; y <= 2020; y++) {
    for (let m = 1; m <= 12; m++) {
      const path = `${logFilePath}/${y}${Math.floor(m / 10)}${m % 10}/**/*.log`;
      console.log(path);
      await parse(path);
    }
  }
}

if (require.main === module) {
  const path = '../rumors-line-bot-logs';
  main(path)
    .then(console.log)
    .catch(console.error);
}
