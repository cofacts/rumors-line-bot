import UserArticleLink from 'src/database/models/userArticleLink';
import { gql } from '../testUtils';

jest.mock('src/database/models/userArticleLink');

it('context rejects anonymous users', async () => {
  const result = await gql`
    {
      userArticleLinks {
        articleId
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

it('invokes ArticleReplyLinks.find() properly', async () => {
  UserArticleLink.find = jest.fn();

  await gql`
    {
      userArticleLinks {
        articleId
      }
    }
  `(
    {},
    {
      userId: 'U12345678',
    }
  );
  expect(UserArticleLink.find.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "limit": undefined,
          "skip": undefined,
          "userId": "U12345678",
        },
      ],
    ]
  `);
});
