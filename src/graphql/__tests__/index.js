jest.mock('src/lib/redisClient');
jest.mock('../lineClient');
// Avoid loading src/lib/queue, which really connects to redis
jest.mock('src/lib/queues', () => ({}));

import { getContext } from '../';
import redis from 'src/lib/redisClient';
import { verifyIDToken } from '../lineClient';

beforeEach(() => {
  redis.get.mockClear();
  verifyIDToken.mockClear();
});

describe('getContext', () => {
  it('generates null context for anonymous requests', async () => {
    const context = await getContext({ ctx: { req: { headers: {} } } });

    expect(context).toMatchInlineSnapshot(`
      Object {
        "userContext": null,
        "userId": null,
      }
    `);
  });

  it('reads userContext for logged-in requests', async () => {
    const lineIDToken = `correct-token`;

    redis.get.mockImplementationOnce(() => ({
      data: {
        sessionId: 'correct-session-id',
      },
      foo: 'bar',
    }));
    verifyIDToken.mockImplementationOnce(() => ({
      iss: 'https://access.line.me',
      sub: 'user1',
      aud: 1654258834,
      exp: 1591514952,
      iat: 1591511352,
      amr: ['linesso'],
    }));

    //user is found in redis
    expect(
      await getContext({
        ctx: {
          req: {
            headers: {
              authorization: `line ${lineIDToken}`,
            },
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "userContext": Object {
          "data": Object {
            "sessionId": "correct-session-id",
          },
          "foo": "bar",
        },
        "userId": "user1",
      }
    `);

    //user is not found in redis
    redis.get.mockImplementationOnce(() => null);
    verifyIDToken.mockImplementationOnce(() => ({
      iss: 'https://access.line.me',
      sub: 'user1',
      aud: 1654258834,
      exp: 1591514952,
      iat: 1591511352,
      amr: ['linesso'],
    }));
    expect(
      await getContext({
        ctx: {
          req: {
            headers: {
              authorization: `line ${lineIDToken}`,
            },
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "userContext": Object {},
        "userId": "user1",
      }
    `);
  });
});
