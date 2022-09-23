import MockDate from 'mockdate';
import { validators } from '../schemaValidator';
import UserArticleLink from '../userArticleLink';

const userArticleLinkValidator = validators.userArticleLink;

const FIXED_DATE = 612921600000;

describe('userArticleLink', () => {
  beforeAll(async () => {
    MockDate.set(FIXED_DATE);
  });

  beforeEach(async () => {
    if (await UserArticleLink.collectionExists()) {
      await (await UserArticleLink.client).drop();
    }
  });

  afterAll(async () => {
    MockDate.reset();
  });

  it('[schema] should pass', async () => {
    const data = {
      userId: 'this_is_user_id',
      articleId: 'this_is_article_id',
      createdAt: new Date(),
    };
    const result = userArticleLinkValidator(data);
    expect(result).toMatchSnapshot();
  });

  it('[schema] should fail with wrong type of createdAt', async () => {
    const data = {
      userId: 'this_is_user_id',
      articleId: 'this_is_article_id',
      createdAt: '2020-01-01T20:10:18.314Z',
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

  it('[model] createOrUpdateByUserIdAndArticleId()', async () => {
    const userId = 'userId-2';
    const articleId = 'articleId-2';

    await UserArticleLink.create({ userId, articleId });

    const updatedDate = await UserArticleLink.createOrUpdateByUserIdAndArticleId(
      userId,
      articleId,
      {
        lastViewedAt: new Date(FIXED_DATE + 60 * 1000),
      }
    );

    delete updatedDate._id;
    expect(updatedDate).toMatchSnapshot();
  });

  it('[model] createOrUpdateByUserIdAndArticleId() (upsert)', async () => {
    const userId = 'userId-3';
    const articleId = 'articleId-3';

    const updatedData = await UserArticleLink.createOrUpdateByUserIdAndArticleId(
      userId,
      articleId,
      {
        lastViewedAt: new Date(FIXED_DATE + 60 * 1000),
      }
    );

    delete updatedData._id;
    expect(updatedData).toMatchSnapshot();
  });

  it('[model] findByArticleIds()', async () => {
    const fixtures = [
      {
        userId: 'userId-2',
        articleId: 'a1',
        createdAt: new Date('2020-01-01T18:10:18.314Z'),
      },
      {
        userId: 'userId-1',
        articleId: 'a2',
        createdAt: new Date('2020-01-01T19:10:18.314Z'),
      },
      {
        userId: 'userId-1',
        articleId: 'a3',
        createdAt: new Date('2020-01-01T21:10:18.314Z'),
      },
      {
        userId: 'userId-1',
        articleId: 'a4',
        createdAt: new Date('2020-01-01T20:10:18.314Z'),
      },
      {
        userId: 'userId-1',
        articleId: 'a5',
        createdAt: new Date('2020-01-01T22:10:18.314Z'),
      },
      {
        userId: 'userId-2',
        articleId: 'a2',
        createdAt: new Date('2020-01-01T23:10:18.314Z'),
      },
    ];

    for (const fixture of fixtures) {
      await UserArticleLink.create(fixture);
    }

    const result = await UserArticleLink.findByArticleIds(['a2', 'a1']);

    result.forEach(x => delete x._id);
    expect(result).toMatchSnapshot();
  });
});
