import { gql } from '../testUtils';

it('context rejects anonymous users', async () => {
  const result = await gql`
    {
      context {
        state
      }
    }
  `();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "context": null,
      },
      "errors": Array [
        [GraphQLError: Invalid authentication header],
      ],
    }
  `);
});

it('Returns user context', async () => {
  const result = await gql`
    {
      context {
        state
        issuedAt
        data {
          searchedText
        }
      }
    }
  `(
    {},
    {
      userContext: {
        state: 'CHOOSING_ARTICLE',
        issuedAt: 1586013070089,
        data: {
          searchedText: 'Foo',
        },
      },
    }
  );
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "context": Object {
          "data": Object {
            "searchedText": "Foo",
          },
          "issuedAt": 1586013070089,
          "state": "CHOOSING_ARTICLE",
        },
      },
    }
  `);
});
