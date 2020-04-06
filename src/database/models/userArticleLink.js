import Base from './base';

/**
 * https://g0v.hackmd.io/eIeU2g86Tfu5VnLazNfUvQ
 */
class UserArticleLink extends Base {
  /**
   *
   * @override
   */
  async create(data) {
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
}

export default new UserArticleLink('userArticleLink');
