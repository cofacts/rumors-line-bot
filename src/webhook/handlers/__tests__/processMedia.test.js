jest.mock('src/lib/gql');
jest.mock('src/lib/ga');
jest.mock('src/lib/detectDialogflowIntent');

import MockDate from 'mockdate';
import processMedia from '../processMedia';
import {
  oneIdenticalVideoArticle,
  getVideoArticle,
  notFound,
} from '../__fixtures__/processMedia';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

beforeEach(() => {
  ga.clearAllMocks();
  gql.__reset();
});

it('one identical video article found and choose for user', async () => {
  gql.__push(oneIdenticalVideoArticle);
  gql.__push(getVideoArticle);

  const data = {
    sessionId: 1497994017447,
  };
  const event = {
    type: 'message',
    timestamp: 1497994016356,
    messageId: '6270464463537',
    message: {
      type: 'video',
      id: '6270464463537',
    },
  };
  const userId = 'Uc76d8ae9ccd1ada4f06c4e1515d46466';
  MockDate.set('2020-01-01');
  expect(await processMedia(data, event, userId)).toMatchSnapshot();
  MockDate.reset();
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "video",
        },
      ],
      Array [
        Object {
          "ea": "ArticleSearch",
          "ec": "UserInput",
          "el": "ArticleFound",
        },
      ],
      Array [
        Object {
          "ea": "Search",
          "ec": "Article",
          "el": "video-article-1",
          "ni": true,
        },
      ],
      Array [
        Object {
          "ea": "Selected",
          "ec": "Article",
          "el": "video-article-1",
        },
      ],
      Array [
        Object {
          "ea": "Search",
          "ec": "Reply",
          "el": "AVygFA0RyCdS-nWhuaXY",
          "ni": true,
        },
      ],
      Array [
        Object {
          "ea": "Search",
          "ec": "Reply",
          "el": "AVy6LkWIyCdS-nWhuaqu",
          "ni": true,
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(2);
});

it('should handle video not found', async () => {
  gql.__push(notFound);
  const data = {
    sessionId: 1497994017447,
  };
  const event = {
    type: 'message',
    timestamp: 1497994016356,
    messageId: '6530038889933',
    message: {
      type: 'video',
      id: '6530038889933',
    },
  };
  const userId = 'Uc76d8ae9ccd1ada4f06c4e1515d46466';
  MockDate.set('2020-01-01');
  expect(await processMedia(data, event, userId)).toMatchSnapshot();
  MockDate.reset();
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "video",
        },
      ],
      Array [
        Object {
          "ea": "ArticleSearch",
          "ec": "UserInput",
          "el": "ArticleNotFound",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});
