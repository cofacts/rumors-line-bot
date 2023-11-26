import MockDate from 'mockdate';
import handleInput from '../handleInput';
import originalInitState from '../initState';
import originalHandlePostback from '../handlePostback';
import { TUTORIAL_STEPS } from '../tutorial';

import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import { MessageEvent, TextEventMessage } from '@line/bot-sdk';

jest.mock('../handlers/initState');
jest.mock('../handlePostback');

const initState = originalInitState as jest.MockedFunction<
  typeof originalInitState
>;
const handlePostback = originalHandlePostback as jest.MockedFunction<
  typeof originalHandlePostback
>;

// If session is renewed, sessionId will become this value
const NOW = 1561982400000;

beforeEach(() => {
  initState.mockClear();
  handlePostback.mockClear();
  MockDate.set(NOW);
});

afterEach(() => {
  MockDate.reset();
});

function createTextMessageEvent(
  input: string
): MessageEvent & { message: Pick<TextEventMessage, 'type' | 'text'> } {
  return {
    type: 'message',
    message: {
      id: '',
      type: 'text',
      text: input,
    },
    mode: 'active',
    timestamp: 0,
    source: {
      type: 'user',
      userId: '',
    },
    replyToken: '',
  };
}

it('shows reply list when VIEW_ARTICLE_PREFIX is sent', async () => {
  const event = createTextMessageEvent(
    `${VIEW_ARTICLE_PREFIX}${getArticleURL('article-id')}`
  );

  handlePostback.mockImplementationOnce((data) => {
    return Promise.resolve({
      context: { data },
      replies: [],
    });
  });

  await expect(handleInput(event, 'user-id')).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "searchedText": "",
                "sessionId": 1561982400000,
              },
            },
            "replies": Array [],
          }
        `);

  expect(handlePostback).toHaveBeenCalledTimes(1);
  expect(handlePostback.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "searchedText": "",
          "sessionId": 1561982400000,
        },
        Object {
          "input": "article-id",
          "sessionId": 1561982400000,
          "state": "CHOOSING_ARTICLE",
        },
        "user-id",
      ],
    ]
  `);
});

it('shows reply list when article URL is sent', async () => {
  const event = createTextMessageEvent(
    getArticleURL('article-id') + '  \n  ' /* simulate manual input */
  );

  handlePostback.mockImplementationOnce((data) => {
    return Promise.resolve({
      context: { data },
      replies: [],
    });
  });

  await expect(handleInput(event, 'user-id')).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "searchedText": "",
                "sessionId": 1561982400000,
              },
            },
            "replies": Array [],
          }
        `);

  expect(handlePostback).toHaveBeenCalledTimes(1);
  expect(handlePostback.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "searchedText": "",
          "sessionId": 1561982400000,
        },
        Object {
          "input": "article-id",
          "sessionId": 1561982400000,
          "state": "CHOOSING_ARTICLE",
        },
        "user-id",
      ],
    ]
  `);
});

it('Resets session on free-form input, triggers fast-forward', async () => {
  const input = 'Newly forwarded message';
  const event = createTextMessageEvent(input);

  initState.mockImplementationOnce(({ data }) => {
    return Promise.resolve({
      data,
      replies: [],
    });
  });

  await expect(handleInput(event, 'user-id')).resolves.toMatchInlineSnapshot(`
          Object {
            "context": Object {
              "data": Object {
                "searchedText": "Newly forwarded message",
                "sessionId": 1561982400000,
              },
            },
            "replies": Array [],
          }
        `);

  expect(initState).toHaveBeenCalledTimes(1);
  expect(initState.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "data": Object {
            "searchedText": "Newly forwarded message",
            "sessionId": 1561982400000,
          },
          "userId": "user-id",
        },
      ],
    ]
  `);
});

describe('tutorial', () => {
  it('handles tutorial trigger from rich menu', async () => {
    const event = createTextMessageEvent(TUTORIAL_STEPS['RICH_MENU']);

    handlePostback.mockImplementationOnce((data) => {
      return Promise.resolve({
        context: { data },
        replies: [],
      });
    });

    await expect(handleInput(event, 'user-id')).resolves.toMatchInlineSnapshot(`
            Object {
              "context": Object {
                "data": Object {
                  "searchedText": "",
                  "sessionId": 1561982400000,
                },
              },
              "replies": Array [],
            }
          `);

    expect(handlePostback).toHaveBeenCalledTimes(1);
  });
});
