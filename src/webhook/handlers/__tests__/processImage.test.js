jest.mock('src/lib/gql');
jest.mock('src/lib/ga');
jest.mock('src/lib/detectDialogflowIntent');
jest.mock('src/webhook/handlePostback', () =>
  jest.fn(() => '__HANDLE_POSTBACK_RESULT__')
);

import MockDate from 'mockdate';
import processImage from '../processImage';
import * as apiResult from '../__fixtures__/processImage';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import handlePostback from 'src/webhook/handlePostback';

beforeEach(() => {
  ga.clearAllMocks();
  gql.__reset();
  handlePostback.mockClear();
});

it('one article found', async () => {
  gql.__push(apiResult.oneImageArticle);

  const data = {
    sessionId: 1497994017447,
  };
  const event = {
    type: 'message',
    timestamp: 1497994016356,
    message: {
      type: 'image',
      id: '6270464463537',
    },
  };
  const userId = 'Uc76d8ae9ccd1ada4f06c4e1515d46466';
  MockDate.set('2020-01-01');
  expect(await processImage(data, event, userId)).toMatchSnapshot();
  MockDate.reset();
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "image",
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
          "el": "image-article-1",
          "ni": true,
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('twelve articles found', async () => {
  gql.__push(apiResult.twelveImageArticles);

  const data = {
    sessionId: 1497994017447,
  };
  const event = {
    type: 'message',
    timestamp: 1497994016356,
    message: {
      type: 'image',
      id: '6530038889933',
    },
  };
  const userId = 'Uc76d8ae9ccd1ada4f06c4e1515d46466';

  MockDate.set('2020-01-01');
  const result = await processImage(data, event, userId);
  MockDate.reset();
  expect(result).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
  expect(result.replies.length).toBeLessThanOrEqual(5); // Reply message API limit
  const carousel = result.replies.find(({ type }) => type === 'flex').contents;
  expect(carousel.type).toBe('carousel');
  expect(carousel.contents.length).toBeLessThanOrEqual(10); // Flex message carousel 10 bubble limit
  expect(JSON.stringify(carousel).length).toBeLessThan(50 * 1000); // Flex message carousel 50K limit
});

// it('articles found with high similarity', async () => {
//   gql.__push(apiResult.twoShortArticles);

//   const input = {
//     data: {
//       sessionId: 1497994017447,
//     },
//     event: {
//       type: 'message',
//       input: 'YouTube · 寻找健康人生',
//       timestamp: 1497994016356,
//       message: {
//         type: 'text',
//         id: '6270464463537',
//         text: 'YouTube · 寻找健康人生',
//       },
//     },
//     userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
//     replies: undefined,
//   };

//   expect(await processImage(input)).toMatchSnapshot();
//   expect(gql.__finished()).toBe(true);
//   expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
//     Array [
//       Array [
//         Object {
//           "ea": "MessageType",
//           "ec": "UserInput",
//           "el": "text",
//         },
//       ],
//       Array [
//         Object {
//           "ea": "ArticleSearch",
//           "ec": "UserInput",
//           "el": "ArticleFound",
//         },
//       ],
//       Array [
//         Object {
//           "ea": "Search",
//           "ec": "Article",
//           "el": "AVvY-yizyCdS-nWhuYWx",
//           "ni": true,
//         },
//       ],
//       Array [
//         Object {
//           "ea": "Search",
//           "ec": "Article",
//           "el": "AVvY-yizyCdS-nWhuYWy",
//           "ni": true,
//         },
//       ],
//     ]
//   `);
//   expect(ga.sendMock).toHaveBeenCalledTimes(1);
// });

// it('only one article found with high similarity', async () => {
//   gql.__push(apiResult.shortArticle);

//   const input = {
//     data: {
//       sessionId: 1497994017447,
//     },
//     event: {
//       type: 'message',
//       input: 'YouTube · 寻找健康人生',
//       timestamp: 1497994016356,
//       message: {
//         type: 'text',
//         id: '6270464463537',
//         text: 'YouTube · 寻找健康人生',
//       },
//     },
//     userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
//     replies: undefined,
//   };

//   expect(await processImage(input)).toBe('__HANDLE_POSTBACK_RESULT__');
//   expect(handlePostback.mock.calls[0]).toMatchInlineSnapshot(`
//     Array [
//       Object {
//         "data": Object {
//           "searchedText": "YouTube · 寻找健康人生",
//           "sessionId": 1497994017447,
//         },
//       },
//       "CHOOSING_ARTICLE",
//       Object {
//         "input": "AVvY-yizyCdS-nWhuYWx",
//         "type": "postback",
//       },
//       "Uc76d8ae9ccd1ada4f06c4e1515d46466",
//     ]
//   `);
//   expect(gql.__finished()).toBe(true);
//   expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
//     Array [
//       Array [
//         Object {
//           "ea": "MessageType",
//           "ec": "UserInput",
//           "el": "text",
//         },
//       ],
//       Array [
//         Object {
//           "ea": "ArticleSearch",
//           "ec": "UserInput",
//           "el": "ArticleFound",
//         },
//       ],
//       Array [
//         Object {
//           "ea": "Search",
//           "ec": "Article",
//           "el": "AVvY-yizyCdS-nWhuYWx",
//           "ni": true,
//         },
//       ],
//     ]
//   `);
//   expect(ga.sendMock).toHaveBeenCalledTimes(1);
// });

// it('should handle text not found', async () => {
//   gql.__push(apiResult.notFound);

//   const input = {
//     data: {
//       sessionId: 1497994017447,
//     },
//     event: {
//       type: 'message',
//       input:
//         'YouTube · 寻找健康人生 驚！大批香蕉受到愛滋血污染！這種香蕉千萬不要吃！吃到可能會被 ...',
//       timestamp: 1497994016356,
//       message: {
//         type: 'text',
//         id: '6270464463537',
//         text:
//           'YouTube · 寻找健康人生 驚！大批香蕉受到愛滋血污染！這種香蕉千萬不要吃！吃到可能會被 ...',
//       },
//     },
//     userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
//     replies: undefined,
//   };

//   MockDate.set('2020-01-01');
//   expect(await processImage(input)).toMatchSnapshot();
//   MockDate.reset();
//   expect(gql.__finished()).toBe(true);

//   expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
//     Array [
//       Array [
//         Object {
//           "ea": "MessageType",
//           "ec": "UserInput",
//           "el": "text",
//         },
//       ],
//       Array [
//         Object {
//           "ea": "ArticleSearch",
//           "ec": "UserInput",
//           "el": "ArticleNotFound",
//         },
//       ],
//     ]
//   `);
//   expect(ga.sendMock).toHaveBeenCalledTimes(1);
// });
