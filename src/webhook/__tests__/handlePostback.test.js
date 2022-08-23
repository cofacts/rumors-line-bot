import MockDate from 'mockdate';
import choosingArticle from '../handlers/choosingArticle';
import choosingReply from '../handlers/choosingReply';
import askingArticleSource from '../handlers/askingArticleSource';
import askingArticleSubmissionConsent from '../handlers/askingArticleSubmissionConsent';
import { ManipulationError } from '../handlers/utils';
import handlePostback from '../handlePostback';
import tutorial from '../handlers/tutorial';
import defaultState from '../handlers/defaultState';

jest.mock('../handlers/choosingArticle');
jest.mock('../handlers/choosingReply');
jest.mock('../handlers/askingArticleSource');
jest.mock('../handlers/askingArticleSubmissionConsent');
jest.mock('../handlers/tutorial');
jest.mock('../handlers/defaultState');

// Original session ID in context
const FIXED_DATE = 612964800000;

// If session is renewed, sessionId will become this value
const NOW = 1561982400000;

beforeEach(() => {
  choosingArticle.mockClear();
  choosingReply.mockClear();
  askingArticleSource.mockClear();
  askingArticleSubmissionConsent.mockClear();
  tutorial.mockClear();
  MockDate.set(NOW);
});

afterEach(() => {
  MockDate.reset();
});

it('rejects undefined input', () => {
  const data = {};
  const event = {};

  return expect(
    handlePostback(data, '_MOCK_STATE_', event)
  ).rejects.toMatchInlineSnapshot(`[Error: input undefined]`);
});

it('handles wrong event type', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'follow',
    input: '',
  };

  await expect(
    handlePostback(context, '_MOCK_STATE_', event)
  ).rejects.toMatchInlineSnapshot(`[Error: wrong event type]`);
});

it('invokes state handler specified by event.postbackHandlerState', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };

  for (const { postbackState, expectedHandler } of [
    // The states that are triggered by postback
    {
      postbackState: 'CHOOSING_ARTICLE',
      expectedHandler: choosingArticle,
    },
    {
      postbackState: 'CHOOSING_REPLY',
      expectedHandler: choosingReply,
    },
    {
      postbackState: 'ASKING_ARTICLE_SOURCE',
      expectedHandler: askingArticleSource,
    },
    {
      postbackState: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      expectedHandler: askingArticleSubmissionConsent,
    },
  ]) {
    const event = {
      type: 'postback',
      input: 'Foo',
    };

    expectedHandler.mockImplementationOnce(() => {
      return Promise.resolve({
        // Bare minimal return values by handlers for handlePostback to work without crash
        replies: [],
      });
    });

    await handlePostback(context, postbackState, event);
    expect(expectedHandler).toHaveBeenCalledTimes(1);
  }

  // Expect that default state is not invoked
  expect(defaultState).not.toHaveBeenCalled();
});

describe('defaultState', () => {
  it('handles unimplemented state', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'postback',
      input: 'foo',
    };
    defaultState.mockImplementationOnce(params => {
      // it doesn't return `state`, discard it
      // eslint-disable-next-line no-unused-vars
      const { state, ...restParams } = params;
      return {
        data: '__MOCK_DEFAULT_STATE_DATA__',
        replies: '__MOCK_DEFAULT_STATE_REPLIES__',
      };
    });

    await expect(handlePostback(context, 'NOT_IMPLEMENTED_YET', event)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "context": Object {
                "data": "__MOCK_DEFAULT_STATE_DATA__",
              },
              "replies": "__MOCK_DEFAULT_STATE_REPLIES__",
            }
          `);
    expect(defaultState).toHaveBeenCalledTimes(1);
  });
});

it('handles ManipulationError fired in handlers', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'postback',
    input: `article-id`,
  };

  choosingArticle.mockImplementationOnce(() =>
    Promise.reject(new ManipulationError('Foo error'))
  );

  await expect(handlePostback(context, 'CHOOSING_ARTICLE', event)).resolves
    .toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "sessionId": 612964800000,
              },
            },
            "replies": Array [
              Object {
                "altText": "Error: Foo error",
                "contents": Object {
                  "body": Object {
                    "contents": Array [
                      Object {
                        "text": "Foo error",
                        "type": "text",
                        "wrap": true,
                      },
                    ],
                    "layout": "vertical",
                    "type": "box",
                  },
                  "header": Object {
                    "contents": Array [
                      Object {
                        "color": "#ffb600",
                        "text": "⚠️ Wrong usage",
                        "type": "text",
                        "weight": "bold",
                      },
                    ],
                    "layout": "vertical",
                    "type": "box",
                  },
                  "styles": Object {
                    "body": Object {
                      "separator": true,
                    },
                  },
                  "type": "bubble",
                },
                "type": "flex",
              },
            ],
          }
        `);
});

it('throws on unknown error', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'postback',
    input: `article-id`,
  };

  choosingArticle.mockImplementationOnce(() =>
    Promise.reject(new Error('Unknown error'))
  );

  await expect(
    handlePostback(context, 'CHOOSING_ARTICLE', event)
  ).rejects.toMatchInlineSnapshot(`[Error: Unknown error]`);
});

describe('tutorial', () => {
  it('handles TUTORIAL postbackHandlerState', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'postback',
      input: 'foo',
    };

    tutorial.mockImplementationOnce(params => {
      // it doesn't return `state`, discard it
      // eslint-disable-next-line no-unused-vars
      const { state, ...restParams } = params;
      return {
        ...restParams,
        replies: 'Foo replies',
      };
    });

    await expect(handlePostback(context, 'TUTORIAL', event)).resolves
      .toMatchInlineSnapshot(`
            Object {
              "context": Object {
                "data": Object {
                  "sessionId": 612964800000,
                },
              },
              "replies": "Foo replies",
            }
          `);

    expect(tutorial).toHaveBeenCalledTimes(1);
  });
});
