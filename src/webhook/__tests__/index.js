jest.mock('src/webhook/checkSignatureAndParse');
jest.mock('src/webhook/lineClient');
jest.mock('src/lib/redisClient');
jest.mock('src/webhook/handlers/tutorial');
jest.mock('src/lib/ga');

import Koa from 'koa';
import request from 'supertest';
import MockDate from 'mockdate';

import webhookRouter, { groupEventQueue, expiredGroupEventQueue } from '../';
import UserSettings from '../../database/models/userSettings';
import Client from '../../database/mongoClient';
import lineClient from 'src/webhook/lineClient';
import redis from 'src/lib/redisClient';
import {
  createGreetingMessage,
  createTutorialMessage,
} from 'src/webhook/handlers/tutorial';
import ga from 'src/lib/ga';

const sleep = async ms => new Promise(resolve => setTimeout(resolve, ms));

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
    await (await Client.getInstance()).close();
    MockDate.reset();
    delete process.env.RUMORS_LINE_BOT_URL;
    await groupEventQueue.close();
    await expiredGroupEventQueue.close();
  });

  it('singleUserHandler() should handle follow event', async () => {
    const userId = 'U4af4980629';
    const app = new Koa();
    app.use(webhookRouter.routes(), webhookRouter.allowedMethods());

    const eventObject = {
      events: [
        {
          replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
          type: 'follow',
          mode: 'active',
          timestamp: 1462629479859,
          source: {
            type: 'user',
            userId,
          },
        },
      ],
    };

    const server = app.listen();

    await request(server)
      .post('/')
      .send(eventObject)
      .expect(200);

    /**
     * The HTTP response isn't guaranteed the event handling to be complete
     */
    await sleep(500);

    expect(
      (await UserSettings.find({ userId })).map(e => ({ ...e, _id: '_id' }))
    ).toMatchSnapshot();

    expect(createGreetingMessage).toHaveBeenCalledTimes(1);
    expect(createTutorialMessage).toHaveBeenCalledTimes(1);
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

    return new Promise((resolve, reject) => {
      server.close(error => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  it('singleUserHandler() should handle follow event with RUMORS_LINE_BOT_URL not set', async () => {
    delete process.env.RUMORS_LINE_BOT_URL;
    const userId = 'U4af4980629';
    const app = new Koa();
    app.use(webhookRouter.routes(), webhookRouter.allowedMethods());

    const eventObject = {
      events: [
        {
          replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
          type: 'follow',
          mode: 'active',
          timestamp: 1462629479859,
          source: {
            type: 'user',
            userId,
          },
        },
      ],
    };

    const server = app.listen();

    await request(server)
      .post('/')
      .send(eventObject)
      .expect(200);

    /**
     * The HTTP response isn't guaranteed the event handling to be complete
     */
    await sleep(500);

    expect(
      (await UserSettings.find({ userId })).map(e => ({ ...e, _id: '_id' }))
    ).toMatchSnapshot();

    expect(createGreetingMessage).not.toHaveBeenCalled();
    expect(createTutorialMessage).not.toHaveBeenCalled();
    expect(ga.sendMock).not.toHaveBeenCalled();
    expect(lineClient.post).not.toHaveBeenCalled();

    return new Promise((resolve, reject) => {
      server.close(error => {
        if (error) return reject(error);
        resolve();
      });
    });
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
      await request(server)
        .post('/')
        .send(eventObject)
        .expect(200);

      /**
       * The HTTP response isn't guaranteed the event handling to be complete
       */
      await sleep(500);
      expect(
        (await UserSettings.find({ userId })).map(e => ({ ...e, _id: '_id' }))
      ).toMatchSnapshot();
    }

    // unfollow event won't send reply message
    expect(lineClient.post).toHaveBeenCalledTimes(2);

    return new Promise((resolve, reject) => {
      server.close(error => {
        if (error) return reject(error);
        resolve();
      });
    });
  });

  it('singleUserHandler() should reply default messages', async () => {
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

    await request(server)
      .post('/')
      .send(eventObject)
      .expect(200);

    /**
     * The HTTP response isn't guaranteed the event handling to be complete
     */
    await sleep(500);

    // snapshot reply messages
    expect(lineClient.post.mock.calls).toMatchSnapshot();
    // snapshot user context
    expect(redis.set.mock.calls).toMatchSnapshot();

    return new Promise((resolve, reject) => {
      server.close(error => {
        if (error) return reject(error);
        resolve();
      });
    });
  });
});
