import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserArticleLink extends Base {
  static get DEFAULT_DATA() {
    return {
      createdAt: new Date(),
      lastViewedAt: null,
      lastRepliedAt: null,
      lastPositiveFeedbackRepliedAt: null,
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
  static async findByUserIdAndArticleId(userId, articleId) {
    return this.findOneAndUpdate(
      { userId, articleId },
      null,
      this.DEFAULT_DATA
    );
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
  /**
   * @type {?import('mongodb').ObjectId}
   */
  _id;

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
