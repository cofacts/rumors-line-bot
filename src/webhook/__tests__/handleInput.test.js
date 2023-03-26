import MockDate from 'mockdate';
import initState from '../handlers/initState';
import handleInput from '../handleInput';
import tutorial, { TUTORIAL_STEPS } from '../handlers/tutorial';
import handlePostback from '../handlePostback';

import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';

jest.mock('../handlers/initState');
jest.mock('../handlers/tutorial');
jest.mock('../handlePostback');

// Original session ID in context
const FIXED_DATE = 612964800000;

// If session is renewed, sessionId will become this value
const NOW = 1561982400000;

beforeEach(() => {
  initState.mockClear();
  handlePostback.mockClear();
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

it('shows reply list when VIEW_ARTICLE_PREFIX is sent', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: `${VIEW_ARTICLE_PREFIX}${getArticleURL('article-id')}`,
  };

  // eslint-disable-next-line no-unused-vars
  handlePostback.mockImplementationOnce((context, state, event, userid) => {
    return Promise.resolve({
      context,
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

  expect(handlePostback).toHaveBeenCalledTimes(1);
  expect(handlePostback.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "data": Object {
            "searchedText": "",
            "sessionId": 1561982400000,
          },
        },
        "CHOOSING_ARTICLE",
        Object {
          "input": "article-id",
          "type": "postback",
        },
        undefined,
      ],
    ]
  `);
});

it('shows reply list when article URL is sent', async () => {
  const context = {
    data: { sessionId: FIXED_DATE },
  };
  const event = {
    type: 'message',
    input: getArticleURL('article-id') + '  \n  ' /* simulate manual input */,
  };

  // eslint-disable-next-line no-unused-vars
  handlePostback.mockImplementationOnce((context, state, event, userid) => {
    return Promise.resolve({
      context,
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

  expect(handlePostback).toHaveBeenCalledTimes(1);
  expect(handlePostback.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "data": Object {
            "searchedText": "",
            "sessionId": 1561982400000,
          },
        },
        "CHOOSING_ARTICLE",
        Object {
          "input": "article-id",
          "type": "postback",
        },
        undefined,
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

  // eslint-disable-next-line no-unused-vars
  initState.mockImplementationOnce(({ data, event, userId, replies }) => {
    return Promise.resolve({
      data,
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

  expect(initState).toHaveBeenCalledTimes(1);
  expect(initState.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "data": Object {
            "sessionId": 1561982400000,
          },
          "event": Object {
            "input": "Newly forwarded message",
            "type": "message",
          },
          "replies": undefined,
          "state": "__INIT__",
          "userId": undefined,
        },
      ],
    ]
  `);
});

describe('defaultState', () => {
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

describe('tutorial', () => {
  it('handles tutorial trigger from rich menu', async () => {
    const context = {
      data: { sessionId: FIXED_DATE },
    };
    const event = {
      type: 'message',
      input: TUTORIAL_STEPS['RICH_MENU'],
    };

    tutorial.mockImplementationOnce((params) => {
      // it doesn't return `state`, discard it
      // eslint-disable-next-line no-unused-vars
      const { state, ...restParams } = params;
      return {
        ...restParams,
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
