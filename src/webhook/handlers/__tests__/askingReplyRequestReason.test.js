jest.mock('src/lib/ga');

import askingReplyRequestReason from '../askingReplyRequestReason';
import {
  REASON_PREFIX,
  SOURCE_PREFIX,
  ARTICLE_SOURCE_OPTIONS,
} from 'src/lib/sharedUtils';
import ga from 'src/lib/ga';

beforeEach(() => {
  ga.clearAllMocks();
});

it('should block incorrect prefix', async () => {
  const params = {
    data: {
      selectedArticleId: 'selected-article-id',
    },
    state: 'ASKING_REPLY_REQUEST_REASON',
    event: {
      type: 'message',
      input: REASON_PREFIX + 'foo', // Wrong prefix
    },
  };
  await expect(askingReplyRequestReason(params)).rejects.toMatchInlineSnapshot(
    `[Error: Please press the latest button to submit message to database.]`
  );
});

it('records article source', async () => {
  const params = {
    data: {
      selectedArticleId: 'selected-article-id',
    },
    state: 'ASKING_REPLY_REQUEST_REASON',
    event: {
      input:
        SOURCE_PREFIX + ARTICLE_SOURCE_OPTIONS.find(({ valid }) => valid).label, // From LIFF
    },
  };
  expect(await askingReplyRequestReason(params)).toMatchSnapshot();
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
