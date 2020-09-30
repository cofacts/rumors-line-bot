jest.mock('src/lib/gql');
jest.mock('src/lib/ga');

import askingReplyFeedback from '../askingReplyFeedback';
import * as apiResult from '../__fixtures__/askingReplyFeedback';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import { UPVOTE_PREFIX, DOWNVOTE_PREFIX } from 'src/lib/sharedUtils';

beforeEach(() => {
  gql.__reset();
  ga.clearAllMocks();
});

const commonParamsYes = {
  data: {
    searchedText: '貼圖',
    selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    selectedArticleText:
      '(0)(1)(/)(0)(9)(line)免費貼圖\n\n「[全螢幕貼圖]生活市集x生活小黑熊」\nhttps://line.me/S/sticker/10299\n\n「松果購物 x 狗與鹿(動態貼圖) 」\nhttps://line.me/S/sticker/10300\n\n「LINE TV X 我的男孩限免貼圖」\nhttps://line.me/S/sticker/10207',
    selectedReplyId: 'AWDZeeV0yCdS-nWhuml8',
  },
  event: {
    type: 'text',
    input: `${UPVOTE_PREFIX}Reply is good!`,
    timestamp: 1519019734813,
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "yes" postback with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);
  expect(await askingReplyFeedback(commonParamsYes)).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);

  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Feedback-Vote",
          "ec": "UserInput",
          "el": "AWDZYXxAyCdS-nWhumlz/AWDZeeV0yCdS-nWhuml8",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('handles "yes" postback with other existing feedbacks', async () => {
  gql.__push(apiResult.twoFeedbacks);
  expect(await askingReplyFeedback(commonParamsYes)).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
});

const commonParamsNo = {
  data: {
    searchedText: '貼圖',
    selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    selectedReplyId: 'AWDZeeV0yCdS-nWhuml8',
  },
  event: {
    type: 'text',
    input: `${DOWNVOTE_PREFIX}我覺得不行`,
    timestamp: 1519019734813,
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles "no" postback with no other existing feedbacks', async () => {
  gql.__push(apiResult.oneFeedback);
  expect(await askingReplyFeedback(commonParamsNo)).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
});

it('handles "no" postback with other existing feedback comments', async () => {
  gql.__push(apiResult.twoFeedbacks);
  expect(await askingReplyFeedback(commonParamsNo)).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
});

const commonParamsInvalid = {
  data: {
    searchedText: '貼圖',
    selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    // No selectedReplyId
  },
  event: {
    type: 'text',
    input: 'asdasdasd',
    timestamp: 1519019734813,
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
  isSkipUser: false,
};

it('handles invalid params', async () => {
  await expect(
    askingReplyFeedback(commonParamsInvalid)
  ).rejects.toMatchInlineSnapshot(`[Error: selectedReply not set in data]`);
  expect(ga.sendMock).toHaveBeenCalledTimes(0);
});

it('gracefully handle graphql error', async () => {
  gql.__push(apiResult.error);
  await expect(
    askingReplyFeedback(commonParamsYes)
  ).rejects.toMatchInlineSnapshot(
    `[Error: Cannot record your feedback. Try again later?]`
  );
  expect(gql.__finished()).toBe(true);
  expect(ga.sendMock).toHaveBeenCalledTimes(0);
});
