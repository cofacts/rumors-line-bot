jest.mock('../lineClient');

import Client from 'src/database/mongoClient';
import UserArticleLink from 'src/database/models/userArticleLink';
import MockDate from 'mockdate';
import { gql } from '../testUtils';

it('context rejects anonymous users', async () => {
  const result = await gql`
    mutation($articleId: String!) {
      setViewed(articleId: $articleId) {
        articleId
      }
    }
  `({
    articleId: 'foo',
  });
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "setViewed": null,
      },
      "errors": Array [
        [GraphQLError: Invalid authentication header],
      ],
    }
  `);
});

describe('finds', () => {
  beforeAll(async () => {
    MockDate.set(612921600000);
    if (await UserArticleLink.collectionExists()) {
      await (await UserArticleLink.client).drop();
    }
  });

  afterAll(async () => {
    MockDate.reset();
    await (await Client.getInstance()).close();
  });

  it('creates user article link with current date', () =>
    expect(
      gql`
        mutation($articleId: String!) {
          setViewed(articleId: $articleId) {
            articleId
            lastViewedAt
          }
        }
      `({ articleId: 'foo' }, { userId: 'user1' })
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "setViewed": Object {
            "articleId": "foo",
            "lastViewedAt": 1989-06-04T00:00:00.000Z,
          },
        },
      }
    `));
});
