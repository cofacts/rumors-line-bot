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
      submitReplyRequest
    }
  `();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "submitReplyRequest": null,
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
      submitReplyRequest
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
        "submitReplyRequest": null,
      },
      "errors": Array [
        [GraphQLError: selectedArticleId not in user context],
      ],
    }
  `);
});

it('submits new reply request', async () => {
  apiGql.__push({
    data: {
      CreateOrUpdateReplyRequest: { replyRequestCount: 3 },
    },
  });

  const result = await gql`
    mutation {
      submitReplyRequest
    }
  `(
    {},
    {
      userId: 'U12345678',
      userContext: {
        state: 'CHOOSING_ARTICLE',
        data: { selectedArticleId: 'Foo' },
      },
    }
  );
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "submitReplyRequest": 3,
      },
    }
  `);
});
