jest.mock('../../gql');

import askingReplyFeedback from '../askingNotUsefulFeedback';
import * as apiResult from '../__fixtures__/askingNotUsefulFeedback';
import gql from '../../gql';

let commonParams = {
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
  state: 'ASKING_NOT_USEFUL_FEEDBACK',
  event: {
    type: 'postback',
    input: 'none',
    timestamp: 1519019734813,
    postback: { data: '{"input":"none","issuedAt":1519019701265}' },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "none" postback with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(await askingReplyFeedback(commonParams)).toMatchSnapshot();
});

it('handles "none" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);

  expect(await askingReplyFeedback(commonParams)).toMatchSnapshot();
});

let commonParams2 = {
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
  state: 'ASKING_NOT_USEFUL_FEEDBACK',
  event: {
    type: 'text',
    input: 'comment',
    timestamp: 1519019734813,
    postback: { data: '{"input":"comment","issuedAt":1519019701265}' },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles text comment with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(await askingReplyFeedback(commonParams2)).toMatchSnapshot();
});

it('handles text comment with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);

  expect(await askingReplyFeedback(commonParams2)).toMatchSnapshot();
});

afterEach(() => {
  gql.__reset();
});
