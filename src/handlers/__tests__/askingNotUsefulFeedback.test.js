jest.mock('../../gql');

import askingNotUsefulFeedback from '../askingNotUsefulFeedback';
import * as apiResult from '../__fixtures__/askingNotUsefulFeedback';
import gql from '../../gql';

const commonParamsNone = {
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
    input: 'n',
    timestamp: 1519019734813,
    postback: { data: '{"input":"n","issuedAt":1519019701265}' },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "none" postback with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(await askingNotUsefulFeedback(commonParamsNone)).toMatchSnapshot();
});

it('handles "none" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);

  expect(await askingNotUsefulFeedback(commonParamsNone)).toMatchSnapshot();
});

const commonParamsComment = JSON.parse(JSON.stringify(commonParamsNone));
commonParamsComment.event = {
  type: 'text',
  input: 'comment',
  timestamp: 1519019734813,
  postback: { data: '{"input":"comment","issuedAt":1519019701265}' },
};

it('handles text comment with other existing feedbacks', async () => {
  expect(await askingNotUsefulFeedback(commonParamsComment)).toMatchSnapshot();
});

const commonParamsNoId = JSON.parse(JSON.stringify(commonParamsNone));
commonParamsNoId.data.selectedReplyId = undefined;

it('handles undefined reply id', () => {
  expect(askingNotUsefulFeedback(commonParamsNoId)).rejects.toThrow(
    'selectedReply not set in data'
  );
});

afterEach(() => {
  gql.__reset();
});
