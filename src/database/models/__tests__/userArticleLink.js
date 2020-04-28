import Client from '../../mongoClient';
import MockDate from 'mockdate';
import { compile } from '../schemaValidator';
import UserArticleLink from '../userArticleLink';

const userArticleLinkValidator = compile('userArticleLink');

const FIXED_DATE = 612921600000;

describe('userArticleLink', () => {
  beforeAll(async () => {
    MockDate.set(FIXED_DATE);

    if (await UserArticleLink.collectionExists()) {
      await (await UserArticleLink.client).drop();
    }
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
    const result = await UserArticleLink.create({
      userId: 'this_is_user_id',
      articleId: 'this_is_article_id',
    });
    delete result._id;
    expect(result).toMatchSnapshot();
  });

  it('[model] should fail to create a document', async () => {
    expect(
      UserArticleLink.create({
        articleId: 'this_is_article_id',
      })
    ).rejects.toThrowErrorMatchingSnapshot();
  });

  it('[model] findByUserIdAndArticleId()', async () => {
    const userId = 'userId-0';
    const articleId = 'articleId-0';

    await UserArticleLink.create({ userId, articleId });

    const result = await UserArticleLink.findByUserIdAndArticleId(
      userId,
      articleId
    );
    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] findByUserIdAndArticleId() (upsert)', async () => {
    const userId = 'userId-1';
    const articleId = 'articleId-1';

    const result = await UserArticleLink.findByUserIdAndArticleId(
      userId,
      articleId
    );
    delete result._id;

    expect(result).toMatchSnapshot();
  });

  it('[model] updateTimestamps()', async () => {
    const userId = 'userId-2';
    const articleId = 'articleId-2';

    await UserArticleLink.create({ userId, articleId });

    const updatedDate = await UserArticleLink.updateTimestamps(
      userId,
      articleId,
      {
        lastViewedAt: new Date(FIXED_DATE + 60 * 1000),
      }
    );

    delete updatedDate._id;
    expect(updatedDate).toMatchSnapshot();
  });

  it('[model] updateTimestamps() (upsert)', async () => {
    const userId = 'userId-3';
    const articleId = 'articleId-3';

    const updatedData = await UserArticleLink.updateTimestamps(
      userId,
      articleId,
      {
        lastViewedAt: new Date(FIXED_DATE + 60 * 1000),
      }
    );

    delete updatedData._id;
    expect(updatedData).toMatchSnapshot();
  });
});
