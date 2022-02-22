jest.mock('src/lib/redisClient');
jest.mock('../lineClient');

import { getContext } from '../';
import { sign } from 'src/lib/jwt';
import redis from 'src/lib/redisClient';
import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';
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

  it('generates null context for wrong credentials', async () => {
    redis.get.mockImplementation(() => ({
      data: {
        sessionId: 'correct-session-id',
      },
    }));

    const jwtWithWrongSession = sign({
      sessionId: 'wrong-session-id',
      sub: 'user1',
      exp: Date.now() / 1000 + 10, // future timestamp
    });

    expect(
      await getContext({
        ctx: {
          req: {
            headers: {
              authorization: `Bearer ${jwtWithWrongSession}`,
            },
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "userContext": null,
        "userId": "user1",
      }
    `);

    const jwtWithExpiredSession = sign({
      sessionId: 'correct-session-id',
      sub: 'user1',
      exp: Date.now() / 1000 - 10, // past timestamp
    });

    // Expired JWTs will fail verification, thus its userId is not resolved either
    expect(
      await getContext({
        ctx: {
          req: {
            headers: {
              authorization: `Bearer ${jwtWithExpiredSession}`,
            },
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "userContext": null,
        "userId": null,
      }
    `);

    const jwtWithNoSub = sign({
      sessionId: 'correct-session-id',
      exp: Date.now() / 1000 + 10, // future timestamp
    });

    expect(
      await getContext({
        ctx: {
          req: {
            headers: {
              authorization: `Bearer ${jwtWithNoSub}`,
            },
          },
        },
      })
    ).toMatchInlineSnapshot(`
      Object {
        "userContext": null,
        "userId": null,
      }
    `);

    const lineIDToken = `invalid-token`;

    verifyIDToken.mockImplementationOnce(() => ({
      data: null,
      errors: [
        {
          message: {
            error: 'invalid_request',
            error_description: 'Invalid IdToken.',
          },
        },
      ],
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
        "userContext": null,
        "userId": null,
      }
    `);
  });

  it('reads userContext for logged-in requests', async () => {
    redis.get.mockImplementationOnce(() => ({
      data: {
        sessionId: 'correct-session-id',
      },
      foo: 'bar',
    }));

    const jwt = sign({
      sessionId: 'correct-session-id',
      sub: 'user1',
      exp: Date.now() / 1000 + 10, // future timestamp
    });

    const context = await getContext({
      ctx: {
        req: {
          headers: {
            authorization: `Bearer ${jwt}`,
          },
        },
      },
    });

    expect(context).toMatchInlineSnapshot(`
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

// As graphql/index actually loads all resolvers, the queue instances are created
// and should be closed after this test.
//
afterAll(async () => {
  await groupEventQueue.close();
  await expiredGroupEventQueue.close();
});
