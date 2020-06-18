import Client from 'src/database/mongoClient';
import UserArticleLink from 'src/database/models/userArticleLink';
import { gql } from '../testUtils';

it('context rejects anonymous users', async () => {
  const result = await gql`
    {
      userArticleLinks {
        totalCount
      }
    }
  `();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "userArticleLinks": null,
      },
      "errors": Array [
        [GraphQLError: Invalid authentication header],
      ],
    }
  `);
});

describe('finds', () => {
  beforeAll(async () => {
    const fixtures = [
      {
        userId: 'u2',
        articleId: 'a1',
        createdAt: new Date('2020-01-01T18:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a2',
        createdAt: new Date('2020-01-01T19:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a3',
        createdAt: new Date('2020-01-01T21:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a4',
        createdAt: new Date('2020-01-01T20:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a5',
        createdAt: new Date('2020-01-01T22:10:18.314Z'),
      },
      {
        userId: 'u2',
        articleId: 'a2',
        createdAt: new Date('2020-01-01T23:10:18.314Z'),
      },
    ];

    if (await UserArticleLink.collectionExists()) {
      await (await UserArticleLink.client).drop();
    }

    for (const fixture of fixtures) {
      await UserArticleLink.create(fixture);
    }
  });

  afterAll(async () => {
    await (await Client.getInstance()).close();
  });

  it('finds all without any arguments', () =>
    expect(
      gql`
        {
          userArticleLinks {
            totalCount
            pageInfo {
              firstCursor
              lastCursor
            }
            edges {
              cursor
              node {
                articleId
                createdAt
              }
            }
          }
        }
      `(
        {},
        {
          userId: 'u1',
        }
      )
    ).resolves.toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "userArticleLinks": Object {
            "edges": Array [
              Object {
                "cursor": "MA==",
                "node": Object {
                  "articleId": "a5",
                  "createdAt": 2020-01-01T22:10:18.314Z,
                },
              },
              Object {
                "cursor": "MQ==",
                "node": Object {
                  "articleId": "a3",
                  "createdAt": 2020-01-01T21:10:18.314Z,
                },
              },
              Object {
                "cursor": "Mg==",
                "node": Object {
                  "articleId": "a4",
                  "createdAt": 2020-01-01T20:10:18.314Z,
                },
              },
              Object {
                "cursor": "Mw==",
                "node": Object {
                  "articleId": "a2",
                  "createdAt": 2020-01-01T19:10:18.314Z,
                },
              },
            ],
            "pageInfo": Object {
              "firstCursor": "MA==",
              "lastCursor": "Mw==",
            },
            "totalCount": 4,
          },
        },
      }
    `));
});
