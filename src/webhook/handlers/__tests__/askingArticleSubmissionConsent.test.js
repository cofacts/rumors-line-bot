jest.mock('src/lib/gql');
jest.mock('src/lib/ga');

import MockDate from 'mockdate';
import askingArticleSubmissionConsent from '../askingArticleSubmissionConsent';
import {
  SOURCE_PREFIX_FRIST_SUBMISSION,
  SOURCE_PREFIX_NOT_YET_REPLIED,
  ARTICLE_SOURCE_OPTIONS,
} from 'src/lib/sharedUtils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

import UserArticleLink from '../../../database/models/userArticleLink';
import Client from '../../../database/mongoClient';
import { getLIFFURL } from 'src/webhook/handlers/utils';

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

it('should block incorrect prefix', async () => {
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
    },
    state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    event: {
      type: 'message',
      input: SOURCE_PREFIX_NOT_YET_REPLIED + 'foo', // Wrong prefix
    },
  };

  expect(askingArticleSubmissionConsent(params)).rejects.toMatchInlineSnapshot(
    `[Error: Please press the latest button to submit message to database.]`
  );
});

it('should block non-existence source option', async () => {
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
    },
    state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    event: {
      type: 'message',
      input: SOURCE_PREFIX_FRIST_SUBMISSION + 'foo', // Correct prefix with wrong value
    },
  };

  await expect(
    askingArticleSubmissionConsent(params)
  ).rejects.toMatchInlineSnapshot(
    `[Error: Please tell us where you have received the message using the options we provided.]`
  );
});

it('should redirect user to other fact-checkers for invalid options', async () => {
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
    },
    state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    event: {
      type: 'message',
      input:
        SOURCE_PREFIX_FRIST_SUBMISSION +
        ARTICLE_SOURCE_OPTIONS.find(({ valid }) => !valid).label, // Correct prefix + option that should not proceed
    },
  };

  const result = await askingArticleSubmissionConsent(params);
  expect(result).toMatchSnapshot();
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "ProvidingSource",
          "ec": "UserInput",
          "el": "outside LINE",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should submit article when valid source is provided', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
      sessionId: inputSession,
    },
    state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    event: {
      type: 'message',
      input:
        SOURCE_PREFIX_FRIST_SUBMISSION +
        ARTICLE_SOURCE_OPTIONS.find(({ valid }) => valid).label,
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
          "ea": "ProvidingSource",
          "ec": "UserInput",
          "el": "group message",
        },
      ],
      Array [
        Object {
          "ea": "Create",
          "ec": "Article",
          "el": "Yes",
        },
      ],
      Array [
        Object {
          "ea": "ProvidingSource",
          "ec": "Article",
          "el": "new-article-id/group message",
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
    state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    event: {
      type: 'message',
      input:
        SOURCE_PREFIX_FRIST_SUBMISSION +
        ARTICLE_SOURCE_OPTIONS.find(({ valid }) => valid).label,
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
