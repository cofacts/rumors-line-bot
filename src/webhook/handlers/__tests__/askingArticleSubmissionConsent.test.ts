jest.mock('src/lib/gql');
jest.mock('src/lib/ga');
import type { MockedGa } from 'src/lib/__mocks__/ga';
import type { MockedGql } from 'src/lib/__mocks__/gql';

import MockDate from 'mockdate';
import askingArticleSubmissionConsent from '../askingArticleSubmissionConsent';
import { POSTBACK_NO, POSTBACK_YES } from '../utils';
import originalGql from 'src/lib/gql';
import originalGa from 'src/lib/ga';

const ga = originalGa as MockedGa;
const gql = originalGql as MockedGql;

import UserSettings from 'src/database/models/userSettings';
import UserArticleLink from 'src/database/models/userArticleLink';
import { ChatbotPostbackHandlerParams } from 'src/types/chatbotState';

beforeAll(async () => {
  if (await UserArticleLink.collectionExists()) {
    await (await UserArticleLink.client).drop();
  }
});

beforeEach(() => {
  ga.clearAllMocks();
});

it('throws on incorrect input', async () => {
  const incorrectParam: ChatbotPostbackHandlerParams = {
    data: { sessionId: 0, searchedText: 'foo' },
    postbackData: {
      sessionId: 0,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      input: 'Wrong',
    },
    userId: 'the-user-id',
  };

  expect(
    askingArticleSubmissionConsent(incorrectParam)
  ).rejects.toMatchInlineSnapshot(
    `[Error: Please choose from provided options.]`
  );
});

it('should thank the user if user does not agree to submit', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params: ChatbotPostbackHandlerParams = {
    data: {
      sessionId: inputSession,
      searchedText: 'Some text forwarded by the user',
    },
    postbackData: {
      sessionId: inputSession,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      input: POSTBACK_NO,
    },
    userId: 'userId',
  };

  const { replies } = await askingArticleSubmissionConsent(params);
  expect(replies).toMatchInlineSnapshot(`
    Array [
      Object {
        "altText": "The message has not been reported and won’t be fact-checked. Thanks anyway!",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "The message has not been reported and won’t be fact-checked. Thanks anyway!",
                "type": "text",
                "wrap": true,
              },
            ],
            "layout": "vertical",
            "type": "box",
          },
          "type": "bubble",
        },
        "type": "flex",
      },
    ]
  `);
});

it('should submit article if user agrees to submit', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params: ChatbotPostbackHandlerParams = {
    data: {
      sessionId: inputSession,
      searchedText: 'Some text forwarded by the user',
    },
    postbackData: {
      sessionId: inputSession,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      input: POSTBACK_YES,
    },
    userId: 'userId',
  };

  MockDate.set('2020-01-02');
  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  // The case when have AI replies
  gql.__push({ data: { CreateAIReply: { text: 'Hello from ChatGPT' } } });
  const result = await askingArticleSubmissionConsent(params);
  MockDate.reset();
  expect(gql.__finished()).toBe(true);

  expect(result).toMatchSnapshot('has AI reply');
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

  // The case when no AI reply is provided (such as in the case of insufficient data)
  //
  MockDate.set('2020-01-02');
  gql.__push({ data: { CreateArticle: { id: 'new-article-id-2' } } });
  gql.__push({ data: { CreateAIReply: null } });
  expect(await askingArticleSubmissionConsent(params)).toMatchSnapshot(
    'has no AI reply'
  );
  MockDate.reset();
  expect(gql.__finished()).toBe(true);
});

it('should submit image article if user agrees to submit', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params: ChatbotPostbackHandlerParams = {
    data: {
      sessionId: inputSession,
      searchedText: '',
      messageId: '6530038889933',
      messageType: 'image',
    },
    postbackData: {
      sessionId: inputSession,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      input: POSTBACK_YES,
    },
    userId: 'userId',
  };

  MockDate.set('2020-01-02');
  gql.__push({ data: { CreateMediaArticle: { id: 'new-article-id' } } });
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
  const params: ChatbotPostbackHandlerParams = {
    data: {
      sessionId: 0,
      searchedText: 'Some text forwarded by the user',
    },
    postbackData: {
      sessionId: 0,
      input: POSTBACK_YES,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    },
    userId,
  };

  MockDate.set('2020-01-01');
  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  gql.__push({ data: { CreateAIReply: { text: 'Hello from ChatGPT' } } });
  await askingArticleSubmissionConsent(params);
  MockDate.reset();

  const userArticleLinks = await UserArticleLink.findByUserId(userId);
  expect(userArticleLinks.map((e) => ({ ...e, _id: '_id' }))).toMatchSnapshot();
});

it('should ask user to turn on notification settings if they did not turn it on after creating an Article', async () => {
  const userId = 'user-id-0';
  const params: ChatbotPostbackHandlerParams = {
    data: {
      sessionId: 0,
      searchedText: 'Some text forwarded by the user',
    },
    postbackData: {
      sessionId: 0,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      input: POSTBACK_YES,
    },
    userId,
  };

  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  gql.__push({ data: { CreateAIReply: { text: 'Hello from ChatGPT' } } });
  process.env.NOTIFY_METHOD = 'LINE_NOTIFY';
  await UserSettings.setAllowNewReplyUpdate(userId, false);

  MockDate.set('2020-01-01');
  const results = await askingArticleSubmissionConsent(params);
  MockDate.reset();

  const lastReply = results.replies[4];

  // Make TS happy
  /* istanbul ignore if */
  if (lastReply.type !== 'flex' || lastReply.contents.type !== 'carousel') {
    throw new Error('Wrong type for last reply');
  }

  expect(lastReply.contents.contents).toMatchSnapshot();

  delete process.env.NOTIFY_METHOD;
  await UserSettings.setAllowNewReplyUpdate(userId, true);
});
