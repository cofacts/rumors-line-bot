import Client from '../../mongoClient';
import MockDate from 'mockdate';
import { validators } from '../schemaValidator';
import UserSettings from '../userSettings';

const userSettingsValidator = validators.userSettings;

describe('userSettings', () => {
  beforeAll(async () => {
    MockDate.set(612921600000);

    if (await UserSettings.collectionExists()) {
      await (await UserSettings.client).drop();
    }
  });

  afterAll(async () => {
    await (await Client.getInstance()).close();
  });

  it('[schema] should pass with newReplyNotifyToken is null', async () => {
    const data = {
      userId: 'this_is_user_id',
      allowNewReplyUpdate: true,
      newReplyNotifyToken: null,
    };
    const result = userSettingsValidator(data);
    expect(result).toMatchSnapshot();
  });

  it('[schema] should pass with newReplyNotifyToken is string', async () => {
    const data = {
      userId: 'this_is_user_id',
      allowNewReplyUpdate: true,
      newReplyNotifyToken: 'this_is_token',
    };
    const result = userSettingsValidator(data);
    expect(result).toMatchSnapshot();
  });

  it('[schema] should fail with missing userId', async () => {
    const data = {
      allowNewReplyUpdate: true,
      newReplyNotifyToken: null,
    };
    const result = userSettingsValidator(data);
    expect(result).toMatchSnapshot();
  });

  it('[model] should create a document', async () => {
    const result = await UserSettings.create({ userId: 'this_is_user_id' });
    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] should fail to create a document', async () => {
    expect(
      UserSettings.create({
        allowNewReplyUpdate: false,
      })
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('[model] findByUserId()', async () => {
    const userId = 'userId-0';
    await UserSettings.create({ userId, allowNewReplyUpdate: false });

    const result = await UserSettings.findByUserId(userId);
    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] findByUserId() upsert', async () => {
    const userId = 'userId-1';
    const result = await UserSettings.findByUserId(userId);
    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] setAllowNewReplyUpdate()', async () => {
    const userId = 'userId-2';
    await UserSettings.create({ userId, allowNewReplyUpdate: true });

    const result = await UserSettings.setAllowNewReplyUpdate(userId, false);

    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] setAllowNewReplyUpdate() upsert', async () => {
    const userId = 'userId-3';
    const result = await UserSettings.setAllowNewReplyUpdate(userId, false);

    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] setNewReplyNotifyToken()', async () => {
    const userId = 'userId-4';
    await UserSettings.create({ userId, newReplyNotifyToken: 'notify-token' });

    const result = await UserSettings.setNewReplyNotifyToken(
      userId,
      'notify-token-new'
    );

    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] setNewReplyNotifyToken() upsert', async () => {
    const userId = 'userId-5';
    const result = await UserSettings.setNewReplyNotifyToken(
      userId,
      'notify-token'
    );

    delete result._id;

    expect(result).toMatchSnapshot();
  });
});
