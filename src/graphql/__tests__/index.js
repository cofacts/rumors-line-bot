jest.mock('src/lib/redisClient');

import { getContext } from '../';
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
        "userId": "",
      }
    `);
  });

  it('generates null context for wrong credentials', async () => {
    redis.get.mockImplementationOnce(() => ({
      nonce: 'correctpass',
    }));

    const context = await getContext({
      ctx: {
        req: {
          headers: {
            authorization: `basic ${Buffer.from('user1:wrongpass').toString(
              'base64'
            )}`,
          },
        },
      },
    });

    expect(context).toMatchInlineSnapshot(`
      Object {
        "userContext": null,
        "userId": "user1",
      }
    `);
  });

  it('reads userContext for logged-in requests', async () => {
    redis.get.mockImplementationOnce(() => ({
      nonce: 'correctpass',
      foo: 'bar',
    }));

    const context = await getContext({
      ctx: {
        req: {
          headers: {
            authorization: `basic ${Buffer.from('user1:correctpass').toString(
              'base64'
            )}`,
          },
        },
      },
    });

    expect(context).toMatchInlineSnapshot(`
      Object {
        "userContext": Object {
          "foo": "bar",
          "nonce": "correctpass",
        },
        "userId": "user1",
      }
    `);
  });
});
