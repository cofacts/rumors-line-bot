import { gql } from '../testUtils';

it('context rejects anonymous users', async () => {
  const result = await gql`
    {
      context {
        data {
          sessionId
          searchedText
        }
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
        },
      },
    }
  `);
});
