import MockDate from 'mockdate';
import UserSettings from 'src/database/models/userSettings';
import originalLineClient from 'src/webhook/lineClient';
import originalGa from 'src/lib/ga';
import { sleep, VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import type { MockedGa } from 'src/lib/__mocks__/ga';
import redis from 'src/lib/redisClient';

import singleUserHandler, { getRedisBatchKey } from '../singleUserHandler';
import originalInitState from '../initState';
import originalHandlePostback from '../handlePostback';
import { TUTORIAL_STEPS } from '../tutorial';

import { MessageEvent, PostbackEvent, TextEventMessage } from '@line/bot-sdk';
import { Context } from 'src/types/chatbotState';

jest.mock('src/webhook/lineClient');
jest.mock('src/lib/ga');

jest.mock('../initState');
jest.mock('../handlePostback');

const redisGet = jest.spyOn(redis, 'get');

const initState = originalInitState as jest.MockedFunction<
  typeof originalInitState
>;
const handlePostback = originalHandlePostback as jest.MockedFunction<
  typeof originalHandlePostback
>;

const lineClient = originalLineClient as jest.Mocked<typeof originalLineClient>;
const ga = originalGa as MockedGa;

// If session is renewed, sessionId will become this value
const NOW = 1561982400000;

beforeEach(() => {
  initState.mockClear();
  handlePostback.mockClear();
  redisGet.mockClear();
  lineClient.post.mockClear();
  ga.clearAllMocks();

  MockDate.set(NOW);
});

afterEach(() => {
  MockDate.reset();
});

afterAll(async () => {
  await redis.quit();
});

const userId = 'U4af4980629';

it('handles follow and unfollow event', async () => {
  const followEvent = {
    replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
    type: 'follow',
    mode: 'active',
    timestamp: 1462629479859,
    source: {
      type: 'user',
      userId,
    },
  } as const;

  await singleUserHandler(userId, followEvent);

  // singleUserHandler does not wait for reply, thus we wait here
  await sleep(500);

  expect(
    (await UserSettings.find({ userId })).map((e) => ({ ...e, _id: '_id' }))
  ).toMatchSnapshot('User settings should have notification turned on');

  expect(lineClient.post.mock.calls).toMatchSnapshot('Tutorial replies');

  expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "U4af4980629",
          "TUTORIAL",
        ],
      ]
    `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "Step",
            "ec": "Tutorial",
            "el": "ON_BOARDING",
          },
        ],
      ]
    `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);

  const unfollowEvent = {
    ...followEvent,
    type: 'unfollow',
  } as const;

  await singleUserHandler(userId, unfollowEvent);

  // singleUserHandler does not wait for reply, thus we wait here
  await sleep(500);

  await expect(UserSettings.find({ userId })).resolves.toHaveProperty(
    [0, 'allowNewReplyUpdate'],
    false
  );
});

it('ignores sticker events', async () => {
  const event: MessageEvent & { message: { type: 'sticker' } } = {
    replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
    type: 'message',
    mode: 'active',
    timestamp: 1462629479859,
    source: {
      type: 'user',
      userId,
    },
    message: {
      id: '325708',
      type: 'sticker',
      packageId: '1',
      stickerId: '1',
      stickerResourceType: 'STATIC',
      keywords: [],
    },
  };

  await singleUserHandler(userId, event);

  // singleUserHandler does not wait for reply, thus we wait here
  await sleep(500);

  // Expect ga records the event
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "sticker",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);

  // Exepct no replies
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`Array []`);
});

it('handles postbacks', async () => {
  const sessionId = 123;

  redisGet.mockImplementationOnce(
    (): Promise<{ data: Context }> =>
      Promise.resolve({
        data: { sessionId, searchedText: '' },
      })
  );

  const event: PostbackEvent = {
    type: 'postback',
    postback: {
      data: JSON.stringify({
        sessionId, // Same session ID
        foo: 'bar', // Other postback data
      }),
    },
    mode: 'active',
    timestamp: 0,
    source: {
      type: 'user',
      userId: '',
    },
    replyToken: '',
  };

  handlePostback.mockImplementationOnce((data) => {
    return Promise.resolve({
      context: { data },
      replies: [
        {
          type: 'text',
          text: 'Postback results here',
        },
      ],
    });
  });

  await singleUserHandler(userId, event);
  await sleep(500);

  // Called once with context.data, postbackk data, and anuser
  expect(handlePostback.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "searchedText": "",
          "sessionId": 123,
        },
        Object {
          "foo": "bar",
          "sessionId": 123,
        },
        "U4af4980629",
      ],
    ]
  `);

  // Expect postback results are sent to LINE
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/message/reply",
        Object {
          "messages": Array [
            Object {
              "text": "Postback results here",
              "type": "text",
            },
          ],
          "replyToken": "",
        },
      ],
    ]
  `);
});

it('rejects outdated postback events', async () => {
  // Simulate context removed by Redis
  redisGet.mockImplementationOnce(() => Promise.resolve(null));

  const event: PostbackEvent = {
    type: 'postback',
    postback: {
      data: JSON.stringify({
        sessionId: 123, // Same session ID
        foo: 'bar', // Other postback data
      }),
    },
    mode: 'active',
    timestamp: 0,
    source: {
      type: 'user',
      userId: '',
    },
    replyToken: '',
  };

  await singleUserHandler(userId, event);
  await sleep(500);

  expect(handlePostback).not.toHaveBeenCalled();
  // Expect we are telling user about old buttons
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/message/reply",
        Object {
          "messages": Array [
            Object {
              "text": "🚧 You are currently searching for another message, buttons from previous search sessions do not work now.",
              "type": "text",
            },
          ],
          "replyToken": "",
        },
      ],
    ]
  `);
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

it('forwards to CHOOSING_ARTICLE when VIEW_ARTICLE_PREFIX is sent', async () => {
  const event = createTextMessageEvent(
    `${VIEW_ARTICLE_PREFIX}${getArticleURL('article-id')}`
  );

  handlePostback.mockImplementationOnce((data) => {
    return Promise.resolve({
      context: { data },
      replies: [
        {
          type: 'text',
          text: 'Choosing article resp',
        },
      ],
    });
  });

  await singleUserHandler('user-id', event);

  await sleep(500);

  // Expect handlePostback is called with synthetic CHOOSING_ARTICLE postback
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

  // Expect replies are sent
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/message/reply",
        Object {
          "messages": Array [
            Object {
              "text": "Choosing article resp",
              "type": "text",
            },
          ],
          "replyToken": "",
        },
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
      replies: [
        {
          type: 'text',
          text: 'Choosing article resp',
        },
      ],
    });
  });

  await singleUserHandler('user-id', event);

  await sleep(500);

  // Expect handlePostback is called with synthetic CHOOSING_ARTICLE postback
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

  // Expect replies are sent
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/message/reply",
        Object {
          "messages": Array [
            Object {
              "text": "Choosing article resp",
              "type": "text",
            },
          ],
          "replyToken": "",
        },
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
      replies: [
        {
          type: 'text',
          text: 'Replies here',
        },
      ],
    });
  });

  const REDIS_BATCH_KEY = getRedisBatchKey('user-id');
  const processingPromise = singleUserHandler('user-id', event);
  await sleep(100); // Wait for async redis to be processed

  // Expect the message is added to batch
  expect(redis.range(REDIS_BATCH_KEY, 0, -1)).resolves.toMatchInlineSnapshot(`
    Array [
      Object {
        "searchedText": "Newly forwarded message",
        "type": "text",
      },
    ]
  `);

  // Wait for the whole batch process to finish
  await processingPromise;

  // Expect batch is cleared
  expect(redis.range(REDIS_BATCH_KEY, 0, -1)).resolves.toMatchInlineSnapshot(
    `Array []`
  );

  // Expect initState is called
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

  // Expect replies are sent
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/message/reply",
        Object {
          "messages": Array [
            Object {
              "text": "Replies here",
              "type": "text",
            },
          ],
          "replyToken": "",
        },
      ],
    ]
  `);
});

it('handles tutorial trigger from rich menu', async () => {
  const event = createTextMessageEvent(TUTORIAL_STEPS['RICH_MENU']);

  handlePostback.mockImplementationOnce((data) => {
    return Promise.resolve({
      context: { data },
      replies: [
        {
          type: 'text',
          text: 'Tutorial here',
        },
      ],
    });
  });

  await singleUserHandler('user-id', event);
  await sleep(500);

  // Expect handlePostback is called with synthetic TUTORIAL postback
  expect(handlePostback).toHaveBeenCalledTimes(1);
  expect(handlePostback.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "searchedText": "",
          "sessionId": 1561982400000,
        },
        Object {
          "input": "📖 tutorial",
          "sessionId": 1561982400000,
          "state": "TUTORIAL",
        },
        "user-id",
      ],
    ]
  `);

  // Expect replies are sent
  expect(lineClient.post.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "/message/reply",
        Object {
          "messages": Array [
            Object {
              "text": "Tutorial here",
              "type": "text",
            },
          ],
          "replyToken": "",
        },
      ],
    ]
  `);
});
