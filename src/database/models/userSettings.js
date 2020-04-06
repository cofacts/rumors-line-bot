import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserSettings extends Base {
  /**
   *
   * @override
   */
  async create(data) {
    // Set default
    const {
      allowNewReplyUpdate = true,
      newReplyNotifyToken = null,
      ...rest
    } = data;

    return super.create({
      ...rest,
      allowNewReplyUpdate,
      newReplyNotifyToken,
    });
  }
}

export default new UserSettings('userSettings');
