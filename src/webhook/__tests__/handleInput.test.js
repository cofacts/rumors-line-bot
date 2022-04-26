import MockDate from 'mockdate';
import initState from '../handlers/initState';
import choosingArticle from '../handlers/choosingArticle';
import choosingReply from '../handlers/choosingReply';
import askingReplyFeedback from '../handlers/askingReplyFeedback';
import askingArticleSource from '../handlers/askingArticleSource';
import askingArticleSubmissionConsent from '../handlers/askingArticleSubmissionConsent';
import { ManipulationError } from '../handlers/utils';
import handleInput from '../handleInput';
import tutorial, { TUTORIAL_STEPS } from '../handlers/tutorial';

import {
  DOWNVOTE_PREFIX,
  UPVOTE_PREFIX,
  VIEW_ARTICLE_PREFIX,
  getArticleURL,
} from 'src/lib/sharedUtils';

jest.mock('../handlers/initState');
jest.mock('../handlers/choosingArticle');
jest.mock('../handlers/choosingReply');
jest.mock('../handlers/askingReplyFeedback');
jest.mock('../handlers/askingArticleSource');
jest.mock('../handlers/askingArticleSubmissionConsent');
jest.mock('../handlers/tutorial');

// Original session ID in context
const FIXED_DATE = 612964800000;

// If session is renewed, sessionId will become this value
const NOW = 1561982400000;

beforeEach(() => {
  initState.mockClear();
  choosingArticle.mockClear();
  choosingReply.mockClear();
  askingReplyFeedback.mockClear();
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

  return expect(handleInput(data, event)).rejects.toMatchInlineSnapshot(
    `[Error: input undefined]`
  );
});

it('invokes state handler specified by event.postbackHandlerState', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };

  for (const { postbackState, expectedHandler } of [
    // The states that are triggered by postback
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
      postbackHandlerState: postbackState,
      input: 'Foo',
    };

    expectedHandler.mockImplementationOnce(() => {
      return Promise.resolve({
        // Bare minimal return values by handlers for handleInput to work without crash
        isSkipUser: false,
        replies: [],
      });
    });

    await handleInput(context, event);
    expect(expectedHandler).toHaveBeenCalledTimes(1);
  }

  // Expect that default state is not invoked
  expect(choosingArticle).not.toHaveBeenCalled();
});

it('shows reply list when VIEW_ARTICLE_PREFIX is sent', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: `${VIEW_ARTICLE_PREFIX}${getArticleURL('article-id')}`,
  };

  choosingArticle.mockImplementationOnce(params => {
    // it doesn't return `state`, discard it
    // eslint-disable-next-line no-unused-vars
    const { state, ...restParams } = params;
    return Promise.resolve({
      ...restParams,
      isSkipUser: false,
      replies: 'Foo replies',
    });
  });

  await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "searchedText": "",
                "sessionId": 1561982400000,
              },
            },
            "replies": "Foo replies",
          }
        `);

  expect(choosingReply).not.toHaveBeenCalled();
  expect(choosingArticle).toHaveBeenCalledTimes(1);
});

it('shows reply list when article URL is sent', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: getArticleURL('article-id') + '  \n  ' /* simulate manual input */,
  };

  choosingArticle.mockImplementationOnce(params => {
    // it doesn't return `state`, discard it
    // eslint-disable-next-line no-unused-vars
    const { state, ...restParams } = params;
    return Promise.resolve({
      ...restParams,
      isSkipUser: false,
      replies: 'Foo replies',
    });
  });

  await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "searchedText": "",
                "sessionId": 1561982400000,
              },
            },
            "replies": "Foo replies",
          }
        `);

  expect(choosingReply).not.toHaveBeenCalled();
  expect(choosingArticle).toHaveBeenCalledTimes(1);
  expect(choosingArticle.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "data": Object {
            "searchedText": "",
            "sessionId": 1561982400000,
          },
          "event": Object {
            "input": "article-id",
            "type": "postback",
          },
          "isSkipUser": false,
          "replies": undefined,
          "state": "CHOOSING_ARTICLE",
          "userId": undefined,
        },
      ],
    ]
  `);
});

it('Resets session on free-form input, triggers fast-forward', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: 'Newly forwarded message',
  };

  initState.mockImplementationOnce(params =>
    Promise.resolve({
      ...params,
      isSkipUser: true,
      // isSkipUser should return a state and handleInput again
      state: 'CHOOSING_ARTICLE',
    })
  );

  choosingArticle.mockImplementationOnce(params => {
    // it doesn't return `state`, discard it
    // eslint-disable-next-line no-unused-vars
    const { state, ...restParams } = params;
    return Promise.resolve({
      ...restParams,
      isSkipUser: false,
      replies: 'Foo replies',
    });
  });

  await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "sessionId": 1561982400000,
              },
            },
            "replies": "Foo replies",
          }
        `);

  expect(askingReplyFeedback).not.toHaveBeenCalled();
  expect(initState).toHaveBeenCalledTimes(1);
  expect(choosingArticle).toHaveBeenCalledTimes(1);
});

it('processes upvote', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: `${UPVOTE_PREFIX}My upvote reason`,
  };

  askingReplyFeedback.mockImplementationOnce(params => {
    // it doesn't return `state`, discard it
    // eslint-disable-next-line no-unused-vars
    const { state, ...restParams } = params;
    return Promise.resolve({
      ...restParams,
      isSkipUser: false,
      replies: 'Foo replies',
    });
  });

  await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "sessionId": 612964800000,
              },
            },
            "replies": "Foo replies",
          }
        `);

  expect(askingReplyFeedback).toHaveBeenCalledTimes(1);
});

it('processes downvote', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: `${DOWNVOTE_PREFIX}My downvote reason`,
  };

  askingReplyFeedback.mockImplementationOnce(params => {
    // it doesn't return `state`, discard it
    // eslint-disable-next-line no-unused-vars
    const { state, ...restParams } = params;
    return Promise.resolve({
      ...restParams,
      isSkipUser: false,
      replies: 'Foo replies',
    });
  });

  await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "sessionId": 612964800000,
              },
            },
            "replies": "Foo replies",
          }
        `);

  expect(askingReplyFeedback).toHaveBeenCalledTimes(1);
});

describe('defaultState', () => {
  it('handles unimplemented state', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'postback',
      postbackHandlerState: 'NOT_IMPLEMENTED_YET',
      input: 'foo',
    };

    await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
            Object {
              "context": Object {
                "data": Object {
                  "sessionId": 612964800000,
                },
              },
              "replies": Array [
                Object {
                  "text": "我們看不懂 QQ
            大俠請重新來過。",
                  "type": "text",
                },
              ],
            }
          `);

    expect(initState).not.toHaveBeenCalled();
  });

  it('handles wrong event type', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'follow',
      input: '',
    };

    await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
            Object {
              "context": Object {
                "data": Object {
                  "sessionId": 612964800000,
                },
              },
              "replies": Array [
                Object {
                  "text": "我們看不懂 QQ
            大俠請重新來過。",
                  "type": "text",
                },
              ],
            }
          `);

    expect(initState).not.toHaveBeenCalled();
  });
});

it('handles ManipulationError fired in handlers', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'postback',
    postbackHandlerState: 'CHOOSING_ARTICLE',
    input: `article-id`,
  };

  choosingArticle.mockImplementationOnce(() =>
    Promise.reject(new ManipulationError('Foo error'))
  );

  await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
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
    postbackHandlerState: 'CHOOSING_ARTICLE',
    input: `article-id`,
  };

  choosingArticle.mockImplementationOnce(() =>
    Promise.reject(new Error('Unknown error'))
  );

  await expect(handleInput(context, event)).rejects.toMatchInlineSnapshot(
    `[Error: Unknown error]`
  );
});

describe('tutorial', () => {
  it('handles tutorial trigger from rich menu', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'message',
      input: TUTORIAL_STEPS['RICH_MENU'],
    };

    tutorial.mockImplementationOnce(params => {
      // it doesn't return `state`, discard it
      // eslint-disable-next-line no-unused-vars
      const { state, ...restParams } = params;
      return {
        ...restParams,
        isSkipUser: false,
        replies: 'Foo replies',
      };
    });

    await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
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

  it('handles TUTORIAL postbackHandlerState', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'postback',
      postbackHandlerState: 'TUTORIAL',
      input: 'foo',
    };

    tutorial.mockImplementationOnce(params => {
      // it doesn't return `state`, discard it
      // eslint-disable-next-line no-unused-vars
      const { state, ...restParams } = params;
      return {
        ...restParams,
        isSkipUser: false,
        replies: 'Foo replies',
      };
    });

    await expect(handleInput(context, event)).resolves.toMatchInlineSnapshot(`
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
