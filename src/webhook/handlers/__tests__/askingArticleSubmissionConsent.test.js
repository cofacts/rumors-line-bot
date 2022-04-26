jest.mock('src/lib/gql');
jest.mock('src/lib/ga');

import MockDate from 'mockdate';
import askingArticleSubmissionConsent from '../askingArticleSubmissionConsent';
import { POSTBACK_NO, POSTBACK_YES } from '../utils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

import UserSettings from 'src/database/models/userSettings';
import UserArticleLink from 'src/database/models/userArticleLink';
import Client from 'src/database/mongoClient';

beforeAll(async () => {
  if (await UserArticleLink.collectionExists()) {
    await (await UserArticleLink.client).drop();
  }
});

afterAll(async () => {
  await (await Client.getInstance()).close();
});

beforeEach(() => {
  ga.clearAllMocks();
});

it('throws on incorrect input', async () => {
  const incorrectParam = {
    data: { searchedText: 'foo' },
    state: 'ASKING_ARTICLE_SUBMISSION',
    event: {
      input: 'Wrong',
    },
  };

  expect(
    askingArticleSubmissionConsent(incorrectParam)
  ).rejects.toMatchInlineSnapshot(
    `[Error: Please choose from provided options.]`
  );
});

it('should thank the user if user does not agree to submit', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
      sessionId: inputSession,
    },
    event: {
      type: 'postback',
      input: POSTBACK_NO,
    },
    userId: 'userId',
  };

  const { replies } = await askingArticleSubmissionConsent(params);
  expect(replies).toMatchInlineSnapshot();
});

it('should submit article if user agrees to submit', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
      sessionId: inputSession,
    },
    event: {
      type: 'postback',
      input: POSTBACK_YES,
    },
    userId: 'userId',
  };

  MockDate.set('2020-01-02');
  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  const result = await askingArticleSubmissionConsent(params);
  MockDate.reset();
  expect(gql.__finished()).toBe(true);

  expect(result).toMatchSnapshot();
  expect(result.data.sessionId).not.toEqual(inputSession);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Create",
          "ec": "Article",
          "el": "Yes",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should create a UserArticleLink when creating a Article', async () => {
  const userId = 'user-id-0';
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
    },
    event: {
      type: 'postback',
      input: POSTBACK_YES,
    },
    userId,
  };

  MockDate.set('2020-01-01');
  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  await askingArticleSubmissionConsent(params);
  MockDate.reset();

  const userArticleLinks = await UserArticleLink.findByUserId(userId);
  expect(userArticleLinks.map(e => ({ ...e, _id: '_id' }))).toMatchSnapshot();
});

it('should ask user to turn on notification settings if they did not turn it on after creating an Article', async () => {
  const userId = 'user-id-0';
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
    },
    event: {
      type: 'postback',
      input: POSTBACK_YES,
    },
    userId,
  };

  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  process.env.NOTIFY_METHOD = 'LINE_NOTIFY';
  await UserSettings.setAllowNewReplyUpdate(userId, false);

  MockDate.set('2020-01-01');
  const results = await askingArticleSubmissionConsent(params);
  MockDate.reset();

  expect(results.replies[0].contents.contents).toMatchSnapshot();

  delete process.env.NOTIFY_METHOD;
  await UserSettings.setAllowNewReplyUpdate(userId, true);
});
