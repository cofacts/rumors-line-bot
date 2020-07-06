import lib from './lib';
import redis from 'src/lib/redisClient';
import addTime from 'date-fns/add';

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
}

if (require.main === module) {
  scanRepliesAndNotify();
}
