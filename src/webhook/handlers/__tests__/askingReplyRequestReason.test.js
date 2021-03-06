jest.mock('src/lib/ga');
jest.mock('src/lib/gql');

import MockDate from 'mockdate';
import Client from 'src/database/mongoClient';
import askingReplyRequestReason from '../askingReplyRequestReason';
import {
  REASON_PREFIX,
  SOURCE_PREFIX_NOT_YET_REPLIED,
  ARTICLE_SOURCE_OPTIONS,
} from 'src/lib/sharedUtils';
import UserSettings from 'src/database/models/userSettings';
import ga from 'src/lib/ga';
import * as apiResult from '../__fixtures__/askingReplyRequestReason';
import gql from 'src/lib/gql';

beforeEach(() => {
  ga.clearAllMocks();
  gql.__reset();
});

afterAll(async () => {
  await (await Client.getInstance()).close();
});

it('records article source', async () => {
  const params = {
    data: {
      selectedArticleId: 'selected-article-id',
    },
    event: {
      input:
        SOURCE_PREFIX_NOT_YET_REPLIED +
        ARTICLE_SOURCE_OPTIONS.find(({ valid }) => valid).label, // From LIFF
    },
  };

  MockDate.set('2020-01-01');
  expect(await askingReplyRequestReason(params)).toMatchSnapshot();
  MockDate.reset();

  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "ProvidingSource",
          "ec": "UserInput",
          "el": "group message",
        },
      ],
      Array [
        Object {
          "ea": "ProvidingSource",
          "ec": "Article",
          "el": "selected-article-id/group message",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('handles reason LIFF: incorrect context', async () => {
  const input = {
    data: {
      sessionId: 1497994017447,
      // No selectedArticleId
    },
    event: {
      type: 'message',
      input: REASON_PREFIX + 'My reason',
      timestamp: 1497994016356,
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  await expect(askingReplyRequestReason(input)).rejects.toMatchInlineSnapshot(
    `[Error: Please press the latest button to submit message to database.]`
  );
  expect(ga.sendMock).toHaveBeenCalledTimes(0);
});

it('handles reason LIFF: reply request update failed', async () => {
  const input = {
    data: {
      sessionId: 1497994017447,
      selectedArticleId: 'article-id',
    },
    event: {
      type: 'message',
      input: REASON_PREFIX + 'My reason',
      timestamp: 1497994016356,
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  gql.__push(apiResult.apiError);

  await expect(askingReplyRequestReason(input)).rejects.toMatchInlineSnapshot(
    `[Error: Something went wrong when recording your reason, please try again later.]`
  );
  expect(gql.__finished()).toBe(true);
  expect(ga.sendMock).toHaveBeenCalledTimes(0);
});

it('handles reason LIFF: reply request update success, only 1 reply request', async () => {
  const input = {
    data: {
      sessionId: 1497994017447,
      selectedArticleId: 'article-id',
    },
    event: {
      type: 'message',
      input: REASON_PREFIX + 'My reason',
      timestamp: 1497994016356,
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  gql.__push(apiResult.updateReplyRequestSuccess);

  MockDate.set('2020-01-01');
  expect(await askingReplyRequestReason(input)).toMatchSnapshot();
  MockDate.reset();

  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "ProvidingReason",
          "ec": "Article",
          "el": "article-id",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('handles reason LIFF: reply request update success, multiple reply requests', async () => {
  const input = {
    data: {
      sessionId: 1497994017447,
      selectedArticleId: 'article-id',
    },
    event: {
      type: 'message',
      input: REASON_PREFIX + 'My reason',
      timestamp: 1497994016356,
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  gql.__push(apiResult.updateReplyRequestSuccess2);

  MockDate.set('2020-01-01');
  expect(await askingReplyRequestReason(input)).toMatchSnapshot();
  MockDate.reset();

  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "ProvidingReason",
          "ec": "Article",
          "el": "article-id",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should ask user to turn on notification settings if they did not turn it on', async () => {
  const userId = 'mockUser';
  process.env.NOTIFY_METHOD = 'LINE_NOTIFY';
  await UserSettings.setAllowNewReplyUpdate(userId, false);

  const sourceInput = {
    data: {
      selectedArticleId: 'selected-article-id',
    },
    event: {
      input:
        SOURCE_PREFIX_NOT_YET_REPLIED +
        ARTICLE_SOURCE_OPTIONS.find(({ valid }) => valid).label, // From LIFF
    },
    userId,
  };

  // This snapshot should contain `receive updates` bubble in carousel
  MockDate.set('2020-01-01');
  expect(
    (await askingReplyRequestReason(sourceInput)).replies[0].contents.contents
  ).toMatchSnapshot();
  MockDate.reset();

  const reasonInput = {
    data: {
      sessionId: 1497994017447,
      selectedArticleId: 'article-id',
    },
    event: {
      type: 'message',
      input: REASON_PREFIX + 'My reason',
      timestamp: 1497994016356,
    },
    userId,
    replies: undefined,
    isSkipUser: false,
  };
  gql.__push(apiResult.updateReplyRequestSuccess);

  // This snapshot should also contain `receive updates` bubble in carousel
  MockDate.set('2020-01-01');
  expect(
    (await askingReplyRequestReason(reasonInput)).replies[0].contents.contents
  ).toMatchSnapshot();
  MockDate.reset();

  // Cleanup
  delete process.env.NOTIFY_METHOD;
  await UserSettings.setAllowNewReplyUpdate(userId, true);
});
