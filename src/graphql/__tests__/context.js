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
        data {
          sessionId
          searchedText
        }
      }
    }
  `(
    {},
    {
      userId: 'U12345678',
      userContext: {
        state: 'CHOOSING_ARTICLE',
        data: {
          sessionId: 1586013070089,
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
            "sessionId": "1586013070089",
          },
          "state": "CHOOSING_ARTICLE",
        },
      },
    }
  `);
});
