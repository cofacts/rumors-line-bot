jest.mock('src/lib/gql');
jest.mock('src/lib/ga');

import MockDate from 'mockdate';
import choosingReply from '../choosingReply';
import * as apiResult from '../__fixtures__/choosingReply';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import UserSettings from 'src/database/models/userSettings';

beforeEach(() => {
  MockDate.set('2020-01-01');
  ga.clearAllMocks();
  gql.__reset();
});

afterEach(() => {
  MockDate.reset();
});

// Note: all commented to make unit test pass on other PRs.

describe('should select reply by replyId', () => {
  const params = {
    data: {
      searchedText: '貼圖',
      selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    },
    event: {
      type: 'postback',
      input: 'AWDZeeV0yCdS-nWhuml8',
      timestamp: 1518964687709,
      postback: {
        data: '{"input":"AWDZeeV0yCdS-nWhuml8","state":"CHOOSING_REPLY"}',
      },
    },
    issuedAt: 1518964688672,
    userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
    replies: [],
    isSkipUser: false,
  };

  it('should handle the case with just one reply', async () => {
    gql.__push(apiResult.oneReply);
    expect(await choosingReply(params)).toMatchSnapshot();
    expect(gql.__finished()).toBe(true);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "Selected",
            "ec": "Reply",
            "el": "AWDZeeV0yCdS-nWhuml8",
          },
        ],
        Array [
          Object {
            "ea": "Type",
            "ec": "Reply",
            "el": "NOT_ARTICLE",
            "ni": true,
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('should ask user to turn on notification settings if they did not turn it on', async () => {
    gql.__push(apiResult.oneReply);
    process.env.NOTIFY_METHOD == 'LINE_NOTIFY';
    await UserSettings.setAllowNewReplyUpdate(params.userId, false);

    expect((await choosingReply(params)).replies).toMatchSnapshot();

    // Reset
    await UserSettings.setAllowNewReplyUpdate(params.userId, true);
    delete process.env.NOTIFY_METHOD;
  });

  it('should handle the case with multiple replies', async () => {
    gql.__push(apiResult.multipleReplies);
    expect(await choosingReply(params)).toMatchSnapshot();
    expect(gql.__finished()).toBe(true);
  });
});

it('should block non-postback interactions', async () => {
  const params = {
    data: {
      searchedText: '貼圖',
      selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    },
    event: {
      type: 'text',
      input: '123',
      timestamp: 1518964687709,
    },
    issuedAt: 1518964688672,
    userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
    replies: [],
    isSkipUser: false,
  };

  await expect(choosingReply(params)).rejects.toMatchInlineSnapshot(
    `[Error: Please choose from provided options.]`
  );
});

it('should handle graphql error gracefully', async () => {
  gql.__push({ errors: [] });

  const params = {
    data: {
      searchedText: '貼圖',
      selectedArticleId: 'AWDZYXxAyCdS-nWhumlz',
    },
    event: {
      type: 'postback',
      input: 'AWDZeeV0yCdS-nWhuml8',
      timestamp: 1518964687709,
      postback: {
        data: '{"input":"AWDZeeV0yCdS-nWhuml8","state":"CHOOSING_REPLY"}',
      },
    },
    issuedAt: 1518964688672,
    userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
    replies: [],
    isSkipUser: false,
  };

  await expect(choosingReply(params)).rejects.toMatchInlineSnapshot(
    `[Error: We have problem retrieving message and reply data, please forward the message again]`
  );
  expect(gql.__finished()).toBe(true);
});
