jest.mock('src/webhook/checkSignatureAndParse');
jest.mock('src/webhook/lineClient');
jest.mock('src/lib/redisClient');
jest.mock('src/webhook/handlers/tutorial');
jest.mock('src/lib/ga');

import Koa from 'koa';
import request from 'supertest';
import MockDate from 'mockdate';

import webhookRouter from '../';
import UserSettings from '../../database/models/userSettings';
import lineClient from 'src/webhook/lineClient';
import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';
import redis from 'src/lib/redisClient';
import {
  createGreetingMessage,
  createTutorialMessage,
} from 'src/webhook/handlers/tutorial';
import ga from 'src/lib/ga';

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Webhook router', () => {
  beforeEach(() => {
    redis.set.mockClear();
    lineClient.post.mockClear();
    createGreetingMessage.mockClear();
    createTutorialMessage.mockClear();
    ga.clearAllMocks();
  });

  beforeAll(async () => {
    MockDate.set(612921600000);

    if (await UserSettings.collectionExists()) {
      await (await UserSettings.client).drop();
    }
  });

  beforeEach(async () => {
    process.env.RUMORS_LINE_BOT_URL = 'https://testlinebot.cofacts';
  });

  afterAll(async () => {
    MockDate.reset();
    delete process.env.RUMORS_LINE_BOT_URL;
    await groupEventQueue.close();
    await expiredGroupEventQueue.close();
  });

  it('singleUserHandler() should handle follow then unfollow then follow event', async () => {
    const userId = 'U4af4980630';
    const app = new Koa();
    app.use(webhookRouter.routes(), webhookRouter.allowedMethods());

    const eventObject = {
      events: [
        {
          replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
          type: undefined,
          mode: 'active',
          timestamp: 1462629479859,
          source: {
            type: 'user',
            userId,
          },
        },
      ],
    };

    const types = ['follow', 'unfollow', 'follow'];

    const server = app.listen();

    for (const type of types) {
      eventObject.events[0].type = type;
      await request(server).post('/').send(eventObject).expect(200);

      /**
       * The HTTP response isn't guaranteed the event handling to be complete
       */
      await sleep(500);
      expect(
        (await UserSettings.find({ userId })).map((e) => ({ ...e, _id: '_id' }))
      ).toMatchSnapshot();
    }

    // unfollow event won't send reply message
    expect(lineClient.post).toHaveBeenCalledTimes(2);

    return new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  it('singleUserHandler() should ignore sticker messages', async () => {
    const userId = 'U4af4980630';
    const app = new Koa();
    app.use(webhookRouter.routes(), webhookRouter.allowedMethods());

    const eventObject = {
      events: [
        {
          replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
          type: 'messages',
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
          },
        },
      ],
    };

    const server = app.listen();

    await request(server).post('/').send(eventObject).expect(200);

    /**
     * The HTTP response isn't guaranteed the event handling to be complete
     */
    await sleep(500);

    // snapshot reply messages
    expect(lineClient.post.mock.calls).toMatchSnapshot();
    // snapshot user context
    expect(redis.set.mock.calls).toMatchSnapshot();

    return new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });
});
