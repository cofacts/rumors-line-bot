import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import AppVariable from 'src/database/models/appVariable';
import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';
import { processConnection } from '../utils/connection';

export default {
  insights() {
    // Resolvers in next level
    return {};
  },

  queue() {
    return [groupEventQueue, expiredGroupEventQueue];
  },

  setting(root, args, context) {
    const { userId } = context;
    return UserSettings.findOrInsertByUserId(userId);
  },

  userArticleLinks(root, args, { userId }) {
    const orderBy = args.orderBy || { createdAt: -1 };
    return processConnection(UserArticleLink, {
      ...args,
      filter: { userId },
      orderBy,
    });
  },

  async isMgpAwardee(root, args, { userId }) {
    const awardees = ((await AppVariable.get('mgpAwardees')) || '')
      .trim()
      .split('\n');
    return awardees.includes(userId);
  },
};
