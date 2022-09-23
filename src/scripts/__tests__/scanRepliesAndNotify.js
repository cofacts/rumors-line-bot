jest.mock('./lib');
import MockDate from 'mockdate';
import scanRepliesAndNotify from '../scanRepliesAndNotify';
import AppVariable from 'src/database/models/appVariable';
import lib from '../lib';

beforeEach(async () => {
  if (await AppVariable.collectionExists()) {
    await (await AppVariable.client).drop();
  }
});

it('scan replies and notify', async () => {
  lib.getNotificationList = jest.fn().mockImplementationOnce(() => {});
  lib.sendNotification = jest.fn();
  MockDate.set(612921600000);

  await scanRepliesAndNotify();

  expect(lib.getNotificationList).toHaveBeenCalledTimes(1);
  expect(lib.sendNotification).toHaveBeenCalledTimes(1);

  // Time should be 12 hours before MockDate
  // 12 hour is the default REVIEW_REPLY_BUFFER
  expect(await AppVariable.get('lastScannedAt')).toMatchInlineSnapshot(
    `"1989-06-03T12:00:00.000Z"`
  );
});
