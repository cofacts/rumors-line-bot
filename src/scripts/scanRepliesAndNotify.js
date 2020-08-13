import lib from './lib';
import redis from 'src/lib/redisClient';
import rollbar from 'src/lib/rollbar';
import addTime from 'date-fns/add';
import Client from 'src/database/mongoClient';

export default async function scanRepliesAndNotify() {
  const timeOffset = JSON.parse(process.env.REVIEW_REPLY_BUFFER) || {};
  const lastScannedAt =
    (await redis.get('lastScannedAt')) ||
    addTime(new Date(), { days: -90 }).toISOString();

  console.log('[notify] lastScannedAt:' + lastScannedAt);
  const nowWithOffset = addTime(new Date(), timeOffset).toISOString();
  const notificationList = await lib.getNotificationList(
    lastScannedAt,
    nowWithOffset
  );
  await lib.sendNotification(notificationList);
  await redis.set('lastScannedAt', nowWithOffset);

  // disconnect redis and mongodb
  await redis.quit();
  await (await Client.getInstance()).close();
}

if (require.main === module) {
  scanRepliesAndNotify().catch(e => {
    console.error(e);
    rollbar.error(e);
    process.exit(1);
  });
}
