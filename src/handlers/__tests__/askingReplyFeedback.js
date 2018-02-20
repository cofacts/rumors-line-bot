jest.mock('../../gql');

import askingReplyFeedback from '../askingReplyFeedback';
import * as apiResult from '../__fixtures__/askingReplyFeedback';
import gql from '../../gql';

const commonParams = {
  data: {
    searchedText: '貼圖',
    foundArticleIds: [
      'AWDZYXxAyCdS-nWhumlz',
      '5483323992880-rumor',
      'AV-Urc0jyCdS-nWhuity',
      'AVsh8u7StKp96s659Dgq',
    ],
    selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    foundReplies: [[Object]],
    selectedReply: { id: 'AWDZeeV0yCdS-nWhuml8', replyConnectionId: null },
  },
  state: 'ASKING_REPLY_FEEDBACK',
  event: {
    type: 'postback',
    input: 'y',
    timestamp: 1519019734813,
    postback: { data: '{"input":"y","issuedAt":1519019701265}' },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "yes" postback with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(await askingReplyFeedback(commonParams)).toMatchSnapshot();
});

it('handles "yes" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);

  expect(await askingReplyFeedback(commonParams)).toMatchSnapshot();
});

afterEach(() => {
  gql.__reset();
});
