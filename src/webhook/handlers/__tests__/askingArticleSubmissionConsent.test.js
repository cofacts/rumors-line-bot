jest.mock('src/lib/gql');
jest.mock('src/lib/ga');

import MockDate from 'mockdate';
import askingArticleSubmissionConsent from '../askingArticleSubmissionConsent';
import {
  REASON_PREFIX,
  SOURCE_PREFIX,
  ARTICLE_SOURCE_OPTIONS,
} from 'src/lib/sharedUtils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

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
      input: REASON_PREFIX + 'foo', // Wrong prefix
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
      input: SOURCE_PREFIX + 'foo', // Correct prefix with wrong value
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
        SOURCE_PREFIX +
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
  const params = {
    data: {
      searchedText: 'Some text forwarded by the user',
      foundArticleIds: [],
    },
    state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
    event: {
      type: 'message',
      input:
        SOURCE_PREFIX + ARTICLE_SOURCE_OPTIONS.find(({ valid }) => valid).label,
    },
  };

  MockDate.set('2020-01-01');
  gql.__push({ data: { CreateArticle: { id: 'new-article-id' } } });
  const result = await askingArticleSubmissionConsent(params);
  MockDate.reset();
  expect(gql.__finished()).toBe(true);

  expect(result).toMatchSnapshot();
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
