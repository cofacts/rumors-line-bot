jest.mock('../../gql');

import askingNotUsefulFeedbackSubmission from '../askingNotUsefulFeedbackSubmission';
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
  state: 'ASKING_NOT_USEFUL_FEEDBACK_SUBMISSION',
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

  expect(
    await askingNotUsefulFeedbackSubmission(commonParamsNone)
  ).toMatchSnapshot();
});

it('handles "none" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);

  expect(
    await askingNotUsefulFeedbackSubmission(commonParamsNone)
  ).toMatchSnapshot();
});

const commonParamsComment = JSON.parse(JSON.stringify(commonParamsNone));
commonParamsComment.event = {
  type: 'postback',
  input: 'y',
  timestamp: 1519019734813,
  postback: { data: '{"input":"y","issuedAt":1519019701265}' },
};

it('handles text comment with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(
    await askingNotUsefulFeedbackSubmission(commonParamsComment)
  ).toMatchSnapshot();
});

it('handles text comment with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);

  expect(
    await askingNotUsefulFeedbackSubmission(commonParamsComment)
  ).toMatchSnapshot();
});

const commonParamsModify = JSON.parse(JSON.stringify(commonParamsNone));
commonParamsModify.event = {
  type: 'postback',
  input: 'r',
  timestamp: 1519019734813,
  postback: { data: '{"input":"r","issuedAt":1519019701265}' },
};

it('handles that the user wants to modify his comments', async () => {
  expect(
    await askingNotUsefulFeedbackSubmission(commonParamsModify)
  ).toMatchSnapshot();
});

const commonParamsNoId = JSON.parse(JSON.stringify(commonParamsNone));
commonParamsNoId.data.selectedReplyId = undefined;

it('handles undefined reply id', () => {
  expect(askingNotUsefulFeedbackSubmission(commonParamsNoId)).rejects.toThrow(
    'selectedReply not set in data'
  );
});

afterEach(() => {
  gql.__reset();
});
