jest.mock('../lineClient');

import UserSettings from 'src/database/models/userSettings';
import { gql } from '../testUtils';

it('context rejects anonymous users', async () => {
  const result = await gql`
    mutation UpdateNotification($checked: Boolean!) {
      allowNotification(allow: $checked) {
        allowNewReplyUpdate
        newReplyNotifyToken
      }
    }
  `({
    checked: true,
  });
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "allowNotification": null,
      },
      "errors": Array [
        [GraphQLError: Invalid authentication header],
      ],
    }
  `);
});

describe('finds', () => {
  beforeAll(async () => {
    if (await UserSettings.collectionExists()) {
      await (await UserSettings.client).drop();
    }
  });

  it('creates user setting and set allowNewReplyUpdate to true', () =>
    expect(
      gql`
        mutation UpdateNotification($checked: Boolean!) {
          allowNotification(allow: $checked) {
            userId
            allowNewReplyUpdate
            newReplyNotifyToken
          }
        }
      `(
        {
          checked: true,
        },
        {
          userId: 'user1',
        }
      )
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "allowNotification": Object {
            "allowNewReplyUpdate": true,
            "newReplyNotifyToken": null,
            "userId": "user1",
          },
        },
      }
    `));
  it('finds user2 and sets allowNewReplyUpdate to false and revokes newReplyNotifyToken', async () => {
    const fixture = {
      userId: 'user2',
      allowNewReplyUpdate: true,
      newReplyNotifyToken: 'this_is_token',
    };
    await UserSettings.create(fixture);

    expect(
      await gql`
        mutation UpdateNotification($checked: Boolean!) {
          allowNotification(allow: $checked) {
            userId
            allowNewReplyUpdate
            newReplyNotifyToken
          }
        }
      `(
        {
          checked: false,
        },
        {
          userId: 'user2',
        }
      )
    ).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "allowNotification": Object {
            "allowNewReplyUpdate": false,
            "newReplyNotifyToken": null,
            "userId": "user2",
          },
        },
      }
    `);
  });
});
