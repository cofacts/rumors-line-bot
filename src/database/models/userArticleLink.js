import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserArticleLink extends Base {
  static get DEFAULT_DATA() {
    return {
      createdAt: new Date(),
      lastViewedAt: new Date(),
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
   *
   * @param {string} userId
   * @param {string} articleId
   * @param {object} data
   * @returns {Promise<UserArticleLink>}
   */
  static async createOrUpdateByUserIdAndArticleId(userId, articleId, data) {
    const setOnInsert = Object.assign({}, this.DEFAULT_DATA);

    for (let key in data) {
      delete setOnInsert[key];
    }

    return this.findOneAndUpdate({ userId, articleId }, data, setOnInsert);
  }

  /**
   *
   * @param {string} userId
   * @param {import('mongodb').FindOneOptions} options
   */
  static async findByUserId(userId, options = {}) {
    const { skip = 0, limit = 20, sort = { createdAt: -1 } } = options;
    return this.find({ userId }, { limit, skip, sort });
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
}

export default UserArticleLink;
