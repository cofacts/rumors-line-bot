import { compile } from '../schemaValidator';
import UserSettings from '../userSettings';

const userSettingsValidator = compile('userSettings');

describe('userSettings', () => {
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
});
