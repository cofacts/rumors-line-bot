jest.mock('src/lib/redisClient');

import { getContext } from '../';
import { sign } from 'src/lib/jwt';
import redis from 'src/lib/redisClient';

beforeEach(() => {
  redis.get.mockClear();
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
    redis.get.mockImplementationOnce(() => ({
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
  });
});
