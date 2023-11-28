import MockDate from 'mockdate';
import UserSettings from 'src/database/models/userSettings';
import originalLineClient from 'src/webhook/lineClient';
import originalRedis from 'src/lib/redisClient';
import originalGa from 'src/lib/ga';
import type { MockedGa } from 'src/lib/__mocks__/ga';

import singleUserHandler from '../singleUserHandler';
import originalInitState from '../initState';
import originalHandlePostback from '../handlePostback';
import { TUTORIAL_STEPS } from '../tutorial';

import { VIEW_ARTICLE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import { MessageEvent, TextEventMessage } from '@line/bot-sdk';

jest.mock('src/webhook/lineClient');
jest.mock('src/lib/redisClient');
jest.mock('src/lib/ga');

jest.mock('../initState');
jest.mock('../handlePostback');

const initState = originalInitState as jest.MockedFunction<
  typeof originalInitState
>;
const handlePostback = originalHandlePostback as jest.MockedFunction<
  typeof originalHandlePostback
>;

const lineClient = originalLineClient as jest.Mocked<typeof originalLineClient>;
const redis = originalRedis as jest.Mocked<typeof originalRedis>;
const ga = originalGa as MockedGa;

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// If session is renewed, sessionId will become this value
const NOW = 1561982400000;

beforeEach(() => {
  initState.mockClear();
  handlePostback.mockClear();
  redis.set.mockClear();
  lineClient.post.mockClear();
  ga.clearAllMocks();

  MockDate.set(NOW);
});

afterEach(() => {
  MockDate.reset();
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

// it('handles postbacks', async () => {});

// it('rejects outdated postback events', async () => {});

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
      replies: [],
    });
  });

  await singleUserHandler('user-id', event);

  await sleep(500);

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

  await singleUserHandler('user-id', event);

  await sleep(500);

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

  await singleUserHandler('user-id', event);

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

it('handles tutorial trigger from rich menu', async () => {
  const event = createTextMessageEvent(TUTORIAL_STEPS['RICH_MENU']);

  handlePostback.mockImplementationOnce((data) => {
    return Promise.resolve({
      context: { data },
      replies: [],
    });
  });

  await singleUserHandler('user-id', event);
  await sleep(500);

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
});
