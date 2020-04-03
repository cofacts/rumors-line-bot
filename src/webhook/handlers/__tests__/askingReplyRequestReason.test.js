jest.mock('../../../lib/gql');

import askingReplyRequestReason from '../askingReplyRequestReason';
import * as apiResult from '../__fixtures__/askingReplyRequestReason';
import gql from '../../../lib/gql';
import { REASON_PREFIX } from '../utils';

it('handles the case when prefix does not match', async () => {
  const params = {
    data: {
      selectedArticleId: 'selected-article-id',
    },
    state: 'ASKING_REPLY_REQUEST_REASON',
    event: {
      input: 'FOO', // Wrong format
    },
  };
  expect(await askingReplyRequestReason(params)).toMatchSnapshot();
});

it('extracts reason and submits replyrequest', async () => {
  gql.__push(apiResult.createReplyRequestSuccess);
  const params = {
    data: {
      selectedArticleId: 'selected-article-id',
    },
    state: 'ASKING_REPLY_REQUEST_REASON',
    event: {
      input: `${REASON_PREFIX}Reason goes here`, // From LIFF
    },
  };
  expect(await askingReplyRequestReason(params)).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
});
