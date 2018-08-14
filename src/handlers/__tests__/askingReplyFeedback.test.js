jest.mock('../../gql');

import askingReplyFeedback from '../askingReplyFeedback';
import * as apiResult from '../__fixtures__/askingReplyFeedback';
import gql from '../../gql';

const commonParamsYes = {
  data: {
    searchedText: '貼圖',
    foundArticleIds: [
      'AWDZYXxAyCdS-nWhumlz',
      '5483323992880-rumor',
      'AV-Urc0jyCdS-nWhuity',
      'AVsh8u7StKp96s659Dgq',
    ],
    selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    foundReplyIds: ['AWDZeeV0yCdS-nWhuml8'],
    selectedReplyId: 'AWDZeeV0yCdS-nWhuml8',
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
  gql.__push(apiResult.articleData);
  expect(await askingReplyFeedback(commonParamsYes)).toMatchSnapshot();
});

it('handles "yes" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);
  gql.__push(apiResult.articleData);
  expect(await askingReplyFeedback(commonParamsYes)).toMatchSnapshot();
});

const commonParamsNo = {
  data: {
    searchedText: '貼圖',
    foundArticleIds: [
      'AWDZYXxAyCdS-nWhumlz',
      '5483323992880-rumor',
      'AV-Urc0jyCdS-nWhuity',
      'AVsh8u7StKp96s659Dgq',
    ],
    selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    foundReplyIds: ['AWDZeeV0yCdS-nWhuml8'],
    selectedReplyId: 'AWDZeeV0yCdS-nWhuml8',
  },
  state: 'ASKING_REPLY_FEEDBACK',
  event: {
    type: 'postback',
    input: 'n',
    timestamp: 1519019734813,
    postback: { data: '{"input":"n","issuedAt":1519019701265}' },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "no" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(await askingReplyFeedback(commonParamsNo)).toMatchSnapshot();
});

afterEach(() => {
  gql.__reset();
});
