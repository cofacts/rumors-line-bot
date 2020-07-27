jest.mock('src/lib/redisClient');
jest.mock('./lib');

import scanRepliesAndNotify from '../scanRepliesAndNotify';
import lib from '../lib';
import redis from 'src/lib/redisClient';

it('scan replies and notify', async () => {
  redis.set = jest.fn();
  lib.getNotificationList = jest.fn().mockImplementationOnce(() => {});
  lib.sendNotification = jest.fn();

  await scanRepliesAndNotify();
  expect(lib.getNotificationList).toHaveBeenCalledTimes(1);
  expect(lib.sendNotification).toHaveBeenCalledTimes(1);
});
