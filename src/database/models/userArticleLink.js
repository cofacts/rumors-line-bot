import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserArticleLink extends Base {
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
    // Set default value
    const {
      createdAt = new Date(),
      lastViewedAt = null,
      lastRepliedAt = null,
      lastPositiveFeedbackRepliedAt = null,
      ...rest
    } = data;

    return super.create({
      ...rest,
      createdAt,
      lastViewedAt,
      lastRepliedAt,
      lastPositiveFeedbackRepliedAt,
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
   * @type {string}
   */
  articleId;
  /**
   * @type {?Date}
   */
  lastRepliedAt;
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
