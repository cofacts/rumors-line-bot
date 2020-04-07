import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserSettings extends Base {
  static get collection() {
    return 'userSettings';
  }

  /**
   *
   * @override
   * @param {UserSettings} data
   * @returns {UserSettings}
   */
  static async create(data) {
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

  /**
   * @type {?import('mongodb').ObjectId}
   */
  _id;

  /**
   * @type {string}
   */
  userId;

  /**
   * @type {boolean}
   */
  allowNewReplyUpdate;

  /**
   * @type {?string}
   */
  newReplyNotifyToken;
}

export default UserSettings;
