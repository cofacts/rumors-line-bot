import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserArticleLink extends Base {
  static get DEFAULT_DATA() {
    return {
      createdAt: new Date(),
    };
  }

  static get collection() {
    return 'userArticleLink';
  }

  /**
   * @static
   * @override
   * @param {UserArticleLink} data
   * @returns {UserArticleLink}
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
   * @param {string} articleId
   * @returns {Promise<UserArticleLink>}
   */
  static async findOrInsertByUserIdAndArticleId(userId, articleId) {
    return this.findOneAndUpdate(
      { userId, articleId },
      null,
      this.DEFAULT_DATA
    );
  }

  static async find({ userId, skip = 0, limit = 20 }) {
    return await (await this.client)
      .find({ userId }, { limit, skip, sort: { createdAt: -1 } })
      .toArray();
  }

  /**
   * An atomic and upsert enabled operation.
   * @typedef Timestamps
   * @property {?Date} lastViewedAt
   * @property {?Date} lastRepliedAt
   * @property {?Date} lastPositiveFeedbackRepliedAt
   *
   * @param {string} userId
   * @param {string} articleId
   * @param {Timestamps} data
   * @returns {Promise<UserArticleLink>}
   */
  static async updateTimestamps(userId, articleId, data) {
    const setOnInsert = Object.assign({}, this.DEFAULT_DATA);

    for (let key in data) {
      delete setOnInsert[key];
    }

    return this.findOneAndUpdate({ userId, articleId }, data, setOnInsert);
  }

  static async findByUserId(userId) {
    return (await this.client).find({ userId }).toArray();
  }

  /**
   * @type {string}
   */
  userId;

  /**
   * @type {string}
   */
  articleId;

  /**
   * @type {Date}
   */
  createdAt;

  /**
   * @type {?Date}
   */
  lastViewedAt;

  /**
   * @type {?Date}
   */
  lastRepliedAt;

  /**
   * @type {?Date}
   */
  lastPositiveFeedbackRepliedAt;
}

export default UserArticleLink;
