jest.mock('src/lib/gql');

import apiGql from 'src/lib/gql';
import { gql } from '../testUtils';

beforeEach(() => {
  apiGql.__reset();
});

afterEach(() => {
  expect(apiGql.__finished()).toBe(true);
});

it('rejects anonymous users', async () => {
  const result = await gql`
    mutation {
      submitArticle
    }
  `();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "submitArticle": null,
      },
      "errors": Array [
        [GraphQLError: Invalid authentication header],
      ],
    }
  `);
});

it('do not submit with wrong context', async () => {
  const result = await gql`
    mutation {
      submitArticle
    }
  `(
    {},
    {
      userId: 'U12345678',
      userContext: {
        state: 'INIT_STATE',
        data: {},
      },
    }
  );
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "submitArticle": null,
      },
      "errors": Array [
        [GraphQLError: searchedText not in user context],
      ],
    }
  `);
});

it('submits new article', async () => {
  apiGql.__push({
    data: {
      CreateArticle: { id: 'newArticleId' },
    },
  });

  const result = await gql`
    mutation {
      submitArticle
    }
  `(
    {},
    {
      userId: 'U12345678',
      userContext: {
        state: 'INIT_STATE',
        data: { searchedText: 'Foo' },
      },
    }
  );
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "submitArticle": "newArticleId",
      },
    }
  `);
});
