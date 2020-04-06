import Client from '../../mongoClient';
import MockDate from 'mockdate';
import { compile } from '../schemaValidator';
import userArticleLink from '../userArticleLink';

const userArticleLinkValidator = compile('userArticleLink');

describe('userArticleLink', () => {
  beforeAll(async () => {
    MockDate.set(612921600000);
  });

  afterAll(async () => {
    await (await Client.getInstance()).close();
  });

  it('[schema] should pass', async () => {
    const data = {
      userId: 'this_is_user_id',
      articleId: 'this_is_article_id',
      createdAt: new Date(),
      lastViewedAt: new Date(),
      lastRepliedAt: new Date(),
      lastPositiveFeedbackRepliedAt: new Date(),
    };
    const result = userArticleLinkValidator(data);
    expect(result).toMatchSnapshot();
  });

  it('[schema] should fail with wrong type of createdAt', async () => {
    const data = {
      userId: 'this_is_user_id',
      articleId: 'this_is_article_id',
      createdAt: '2020-01-01T20:10:18.314Z',
      lastViewedAt: new Date(),
      lastRepliedAt: new Date(),
      lastPositiveFeedbackRepliedAt: new Date(),
    };
    const result = userArticleLinkValidator(data);
    expect(result).toMatchSnapshot();
  });

  it('[model] should create a document', async () => {
    const result = await userArticleLink.create({
      userId: 'this_is_user_id',
      articleId: 'this_is_article_id',
    });
    delete result._id;
    expect(result).toMatchSnapshot();
  });

  it('[model] should fail to create a document', async () => {
    MockDate.set(612921600011);
    expect(
      userArticleLink.create({
        articleId: 'this_is_article_id',
      })
    ).rejects.toThrowErrorMatchingSnapshot();
  });
});
