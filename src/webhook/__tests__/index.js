jest.mock('src/webhook/checkSignatureAndParse');
jest.mock('src/lib/redisClient');

import Koa from 'koa';
import request from 'supertest';
import MockDate from 'mockdate';
import { execSync } from 'child_process';

import webhookRouter from '../';
import UserSettings from '../../database/models/userSettings';
import Client from '../../database/mongoClient';

const mongodbCli = evalString => {
  const command = `docker exec mongodb mongo ${
    process.env.MONGODB_URI
  } --quiet --eval '${evalString}'`;
  return execSync(command).toString();
};

describe('Webhook router', () => {
  beforeAll(async () => {
    MockDate.set(612921600000);

    if (await UserSettings.collectionExists()) {
      await (await UserSettings.client).drop();
    }
  });

  afterAll(async () => {
    await (await Client.getInstance()).close();
    MockDate.reset();
  });

  it('singleUserHandler() should handle follow event', async () => {
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
            userId: 'U4af4980629',
          },
        },
      ],
    };

    const server = app.listen();

    await request(server)
      .post('/')
      .send(eventObject)
      .expect(200);

    expect(
      mongodbCli('db.userSettings.find({}, { _id: 0 })')
    ).toMatchSnapshot();

    return new Promise((resolve, reject) => {
      server.close(error => {
        if (error) return reject(error);
        resolve();
      });
    });
  });
});
