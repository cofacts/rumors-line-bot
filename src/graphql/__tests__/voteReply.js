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
      voteReply(vote: UPVOTE)
    }
  `();
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "voteReply": null,
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
      voteReply(vote: UPVOTE)
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
        "voteReply": null,
      },
      "errors": Array [
        [GraphQLError: selectedArticleId or selectedReplyId not in user context],
      ],
    }
  `);
});

it('submits feedback on article reply', async () => {
  apiGql.__push({
    data: {
      CreateOrUpdateArticleReplyFeedback: { feedbackCount: 3 },
    },
  });

  const result = await gql`
    mutation {
      voteReply(vote: UPVOTE)
    }
  `(
    {},
    {
      userId: 'U12345678',
      userContext: {
        state: 'ASKING_REPLY_FEEDBACK',
        data: { selectedArticleId: 'Foo', selectedReplyId: 'Bar' },
      },
    }
  );
  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "voteReply": 3,
      },
    }
  `);
});
