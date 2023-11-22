import MockDate from 'mockdate';
import handlePostback from '../handlePostback';
import { ManipulationError } from '../handlers/utils';
import originalChoosingArticle from '../handlers/choosingArticle';
import originalChoosingReply from '../handlers/choosingReply';
import originalAskingArticleSource from '../handlers/askingArticleSource';
import originalAskingArticleSubmissionConsent from '../handlers/askingArticleSubmissionConsent';
import originalTutorial from '../handlers/tutorial';
import originalDefaultState from '../handlers/defaultState';
import { ChatbotStateHandlerReturnType, Context } from 'src/types/chatbotState';

jest.mock('../handlers/choosingArticle');
jest.mock('../handlers/choosingReply');
jest.mock('../handlers/askingArticleSource');
jest.mock('../handlers/askingArticleSubmissionConsent');
jest.mock('../handlers/tutorial');
jest.mock('../handlers/defaultState');

const choosingArticle = originalChoosingArticle as jest.MockedFunction<
  typeof originalChoosingArticle
>;
const choosingReply = originalChoosingReply as jest.MockedFunction<
  typeof originalChoosingReply
>;
const askingArticleSource = originalAskingArticleSource as jest.MockedFunction<
  typeof originalAskingArticleSource
>;
const askingArticleSubmissionConsent =
  originalAskingArticleSubmissionConsent as jest.MockedFunction<
    typeof originalAskingArticleSubmissionConsent
  >;
const tutorial = originalTutorial as jest.MockedFunction<
  typeof originalTutorial
>;
const defaultState = originalDefaultState as jest.MockedFunction<
  typeof originalDefaultState
>;

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

it('invokes state handler specified by event.postbackHandlerState', async () => {
  const data: Context = {
    sessionId: FIXED_DATE,
    searchedText: '',
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
  ] as const) {
    expectedHandler.mockImplementationOnce(() => {
      return Promise.resolve({
        data: { sessionId: 0, searchedText: '' },
        replies: [],
      } as ChatbotStateHandlerReturnType);
    });

    await handlePostback(
      data,
      {
        sessionId: FIXED_DATE,
        state: postbackState,
        input: 'Foo',
      },
      'user-id'
    );
    expect(expectedHandler).toHaveBeenCalledTimes(1);
  }

  // Expect that default state is not invoked
  expect(defaultState).not.toHaveBeenCalled();
});

describe('defaultState', () => {
  it('handles unimplemented state', async () => {
    const data: Context = { sessionId: FIXED_DATE, searchedText: '' };
    defaultState.mockImplementationOnce(() => {
      return {
        data: { sessionId: 0, searchedText: '' },
        replies: [],
      };
    });

    await expect(
      handlePostback(
        data,
        {
          sessionId: FIXED_DATE,
          input: 'foo',
          state: 'Error',
        },
        'user-id'
      )
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "context": Object {
          "data": Object {
            "searchedText": "",
            "sessionId": 0,
          },
        },
        "replies": Array [],
      }
    `);
    expect(defaultState).toHaveBeenCalledTimes(1);
  });
});

it('handles ManipulationError fired in handlers', async () => {
  const data: Context = { sessionId: FIXED_DATE, searchedText: '' };

  choosingArticle.mockImplementationOnce(() =>
    Promise.reject(new ManipulationError('Foo error'))
  );

  await expect(
    handlePostback(
      data,
      {
        sessionId: FIXED_DATE,
        state: 'CHOOSING_ARTICLE',
        input: 'error',
      },
      'user-id'
    )
  ).resolves.toMatchInlineSnapshot(`
    Object {
      "context": Object {
        "data": Object {
          "searchedText": "",
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
  const data: Context = { sessionId: FIXED_DATE, searchedText: '' };
  choosingArticle.mockImplementationOnce(() =>
    Promise.reject(new Error('Unknown error'))
  );

  await expect(
    handlePostback(
      data,
      { sessionId: FIXED_DATE, state: 'CHOOSING_ARTICLE', input: '' },
      'user-id'
    )
  ).rejects.toMatchInlineSnapshot(`[Error: Unknown error]`);
});

describe('tutorial', () => {
  it('handles TUTORIAL postbackHandlerState', async () => {
    const context: Context = {
      sessionId: FIXED_DATE,
      searchedText: '',
    };

    tutorial.mockImplementationOnce(() => {
      return {
        data: { sessionId: 0, searchedText: '' },
        replies: [],
      };
    });

    await expect(
      handlePostback(
        context,
        { sessionId: FIXED_DATE, state: 'TUTORIAL', input: 'foo' },
        'user-id'
      )
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "context": Object {
          "data": Object {
            "searchedText": "",
            "sessionId": 0,
          },
        },
        "replies": Array [],
      }
    `);

    expect(tutorial).toHaveBeenCalledTimes(1);
  });
});
