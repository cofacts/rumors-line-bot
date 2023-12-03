// Mock unused middlewares and instances that leaves open handles
jest.mock('src/webhook/checkSignatureAndParse');
jest.mock('src/lib/redisClient');

// Spied functions
jest.mock('../handlers/groupHandler');
jest.mock('../handlers/singleUserHandler');

import Koa from 'koa';
import request from 'supertest';
import MockDate from 'mockdate';

import webhookRouter from '..';
import originalSingleUserHandler from '../handlers/singleUserHandler';
import OriginalGroupHandler from '../handlers/groupHandler';
import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';

const singleUserHandler = originalSingleUserHandler as jest.MockedFunction<
  typeof originalSingleUserHandler
>;
const GroupHandler = OriginalGroupHandler as jest.MockedClass<
  typeof OriginalGroupHandler
>;

// The groupHandler instance in global scope of index.ts
//
const groupHandlerInstance = GroupHandler.mock.instances[0];
const mockedAddJob = groupHandlerInstance.addJob as jest.MockedFunction<
  typeof groupHandlerInstance.addJob
>;

import { WebhookEvent } from '@line/bot-sdk';

const sleep = async (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

beforeAll(() => {
  MockDate.set(612921600000);
});

beforeEach(() => {
  mockedAddJob.mockClear();
  GroupHandler.mockClear();
});

afterAll(async () => {
  MockDate.reset();
  await groupEventQueue.close();
  await expiredGroupEventQueue.close();
});

it('invokes singleUserHandler and GroupHandler correctly', async () => {
  const app = new Koa();
  app.use(webhookRouter.routes());

  const events: WebhookEvent[] = [
    // Event from 1-1 chat
    {
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      type: 'message',
      mode: 'active',
      timestamp: 1462629479859,
      source: {
        type: 'user',
        userId: 'U4af4980630',
      },
      message: {
        id: '325708',
        type: 'sticker',
        packageId: '1',
        stickerId: '1',
        stickerResourceType: 'STATIC',
        keywords: [],
      },
    },
    // Event from group chat
    {
      replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
      type: 'message',
      mode: 'active',
      timestamp: 1462629479859,
      source: {
        type: 'group',
        groupId: 'G4af4980630',
      },
      message: {
        id: '325708',
        type: 'sticker',
        packageId: '1',
        stickerId: '1',
        stickerResourceType: 'STATIC',
        keywords: [],
      },
    },
  ];

  const server = app.listen();
  await request(server).post('/').send({ events }).expect(200);

  /**
   * The HTTP response isn't guaranteed the event handling to be complete
   */
  await sleep(500);

  expect(singleUserHandler.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "U4af4980630",
        Object {
          "message": Object {
            "id": "325708",
            "keywords": Array [],
            "packageId": "1",
            "stickerId": "1",
            "stickerResourceType": "STATIC",
            "type": "sticker",
          },
          "mode": "active",
          "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
          "source": Object {
            "type": "user",
            "userId": "U4af4980630",
          },
          "timestamp": 1462629479859,
          "type": "message",
        },
      ],
    ]
  `);

  expect(mockedAddJob.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "groupId": "G4af4980630",
          "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
          "type": "message",
          "webhookEvent": Object {
            "message": Object {
              "id": "325708",
              "keywords": Array [],
              "packageId": "1",
              "stickerId": "1",
              "stickerResourceType": "STATIC",
              "type": "sticker",
            },
            "mode": "active",
            "replyToken": "nHuyWiB7yP5Zw52FIkcQobQuGDXCTA",
            "source": Object {
              "groupId": "G4af4980630",
              "type": "group",
            },
            "timestamp": 1462629479859,
            "type": "message",
          },
        },
      ],
    ]
  `);

  // Stop test after server close
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) return reject(error);
      resolve(undefined);
    });
  });
});
