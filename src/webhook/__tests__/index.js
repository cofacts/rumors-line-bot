jest.mock('src/webhook/checkSignatureAndParse');

import Koa from 'koa';
import request from 'supertest';
import MockDate from 'mockdate';

import webhookRouter from '../';
import UserSettings from '../../database/models/userSettings';

describe('Webhook router', () => {
  beforeAll(async () => {
    MockDate.set(612921600000);

    if (await UserSettings.collectionExists()) {
      await (await UserSettings.client).drop();
    }
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

    await request(app.listen())
      .post('/')
      .send(eventObject)
      .expect(200);

    const user = await UserSettings.findOrInsertByUserId(
      eventObject.events[0].source.userId
    );

    expect(user.userId).toBe(eventObject.events[0].source.userId);
    expect(user.allowNewReplyUpdate).toBe(true);
  });
});
