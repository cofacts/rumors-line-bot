import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserSettings extends Base {
  static get DEFAULT_DATA() {
    return {
      createdAt: new Date(),
      allowNewReplyUpdate: true,
      newReplyNotifyToken: null,
    };
  }

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
    return super.create({
      ...this.DEFAULT_DATA,
      ...data,
    });
  }

  /**
   * An atomic and upsert enabled operation.
   * @param {string} userId
   * @returns {Promise<UserSettings>}
   */
  static async findByUserId(userId) {
    return this.findOneAndUpdate({ userId }, null, this.DEFAULT_DATA);
  }

  /**
   * An atomic and upsert enabled operation.
   * @param {string} userId
   * @param {boolean} allow
   * @returns {Promise<UserSettings>}
   */
  static async setAllowNewReplyUpdate(userId, allow) {
    // eslint-disable-next-line no-unused-vars
    const { allowNewReplyUpdate, ...$setOnInsert } = this.DEFAULT_DATA;

    return this.findOneAndUpdate(
      { userId },
      {
        allowNewReplyUpdate: allow,
      },
      $setOnInsert
    );
  }

  /**
   * An atomic and upsert enabled operation.
   * @param {string} userId
   * @param {string} token
   * @returns {Promise<UserSettings>}
   */
  static async setNewReplyNotifyToken(userId, token) {
    // eslint-disable-next-line no-unused-vars
    const { newReplyNotifyToken, ...$setOnInsert } = this.DEFAULT_DATA;

    return this.findOneAndUpdate(
      { userId },
      {
        newReplyNotifyToken: token,
      },
      $setOnInsert
    );
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
   * @type {Date}
   */
  createdAt;

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
