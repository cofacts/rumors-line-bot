jest.mock('src/lib/gql');

import askingReplyFeedback from '../askingReplyFeedback';
import * as apiResult from '../__fixtures__/askingReplyFeedback';
import gql from 'src/lib/gql';
import { DOWNVOTE_PREFIX } from '../utils';

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
    selectedArticleText:
      '(0)(1)(/)(0)(9)(line)免費貼圖\n\n「[全螢幕貼圖]生活市集x生活小黑熊」\nhttps://line.me/S/sticker/10299\n\n「松果購物 x 狗與鹿(動態貼圖) 」\nhttps://line.me/S/sticker/10300\n\n「LINE TV X 我的男孩限免貼圖」\nhttps://line.me/S/sticker/10207',
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
    type: 'text',
    input: `${DOWNVOTE_PREFIX}我覺得不行`,
    timestamp: 1519019734813,
    message: {
      id: 1519019734813,
      type: 'text',
      text: `${DOWNVOTE_PREFIX}我覺得不行`,
    },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "no" postback with other existing feedback comments', async () => {
  gql.__push(apiResult.oneFeedback);
  expect(await askingReplyFeedback(commonParamsNo)).toMatchSnapshot();

  gql.__push(apiResult.twoFeedbacks);
  expect(await askingReplyFeedback(commonParamsNo)).toMatchSnapshot();
});

const commonParamsOthers = {
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
    type: 'text',
    input: 'asdasdasd',
    timestamp: 1519019734813,
    message: {
      id: 1519019734813,
      type: 'text',
      text: 'asdasdasd',
    },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles unexpected feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);

  expect(await askingReplyFeedback(commonParamsOthers)).toMatchSnapshot();
});

const commonParamsInvalid = {
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
  },
  state: 'ASKING_REPLY_FEEDBACK',
  event: {
    type: 'text',
    input: 'asdasdasd',
    timestamp: 1519019734813,
    message: {
      id: 1519019734813,
      type: 'text',
      text: 'asdasdasd',
    },
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles invalid params', async () => {
  gql.__push(apiResult.oneFeedback);

  await expect(askingReplyFeedback(commonParamsInvalid)).rejects.toThrow(Error);
});

afterEach(() => {
  gql.__reset();
});
