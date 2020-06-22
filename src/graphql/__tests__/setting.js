jest.mock('../lineClient');

import Client from 'src/database/mongoClient';
import UserSettings from 'src/database/models/userSettings';
import { gql } from '../testUtils';

it('context rejects anonymous users', async () => {
  expect(
    await gql`
      {
        setting {
          allowNewReplyUpdate
          newReplyNotifyToken
        }
      }
    `()
  ).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "setting": null,
      },
      "errors": Array [
        [GraphQLError: Invalid authentication header],
      ],
    }
  `);
});

it('creates user1', async () => {
  expect(
    await gql`
      {
        setting {
          allowNewReplyUpdate
          newReplyNotifyToken
        }
      }
    `(
      {},
      {
        userId: 'user1',
        userContext: {
          state: 'INIT_STATE',
          data: {},
        },
      }
    )
  ).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "setting": Object {
          "allowNewReplyUpdate": true,
          "newReplyNotifyToken": null,
        },
      },
    }
  `);
});

it('finds user2', async () => {
  if (await UserSettings.collectionExists()) {
    await (await UserSettings.client).drop();
  }

  const fixture = {
    userId: 'user2',
    allowNewReplyUpdate: true,
    newReplyNotifyToken: 'this_is_token',
  };
  await UserSettings.create(fixture);
  expect(
    await gql`
      {
        setting {
          allowNewReplyUpdate
          newReplyNotifyToken
        }
      }
    `(
      {},
      {
        userId: 'user2',
        userContext: {
          state: 'INIT_STATE',
          data: {},
        },
      }
    )
  ).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "setting": Object {
            "allowNewReplyUpdate": true,
            "newReplyNotifyToken": "this_is_token",
          },
        },
      }
    `);

  await (await Client.getInstance()).close();
});
