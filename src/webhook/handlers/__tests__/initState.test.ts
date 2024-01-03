jest.mock('src/lib/gql');
jest.mock('src/lib/ga');
jest.mock('src/lib/detectDialogflowIntent');

import MockDate from 'mockdate';
import initState from '../initState';
import * as apiListArticleResult from '../__fixtures__/initState';
import * as apiGetArticleResult from '../__fixtures__/choosingArticle';
import type { MockedGql } from 'src/lib/__mocks__/gql';
import originalGql from 'src/lib/gql';
import type { MockedGa } from 'src/lib/__mocks__/ga';
import originalGa from 'src/lib/ga';
import originalDetectDialogflowIntent from 'src/lib/detectDialogflowIntent';
import { FlexMessage } from '@line/bot-sdk';

const gql = originalGql as MockedGql;
const ga = originalGa as MockedGa;
const detectDialogflowIntent =
  originalDetectDialogflowIntent as jest.MockedFunction<
    typeof originalDetectDialogflowIntent
  >;

beforeEach(() => {
  ga.clearAllMocks();
  gql.__reset();
  detectDialogflowIntent.mockClear();
});

it('article found', async () => {
  gql.__push(apiListArticleResult.longArticle);

  expect(
    await initState({
      context: {
        sessionId: 1497994017447,
        msgs: [
          {
            type: 'text',
            id: 'abc',
            text: '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入',
          },
        ],
      },
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    })
  ).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "text",
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
          "el": "AVvY-yizyCdS-nWhuYWx",
          "ni": true,
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('long article replies still below flex message limit', async () => {
  gql.__push(apiListArticleResult.twelveLongArticles);

  const result = await initState({
    context: {
      sessionId: 1502477506267,
      msgs: [
        {
          type: 'text',
          id: 'abc',
          text: '這樣的大事國內媒體竟然不敢報導！\n我國駐日代表將原「中華民國」申請更名為「台灣」結果被日本裁罰，須繳納7000萬日圓（合約台幣2100萬元）高額稅賦(轉載中時電子報）\n\n我駐日代表謝長廷將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭自認友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元）高額稅賦...民進黨沒想到如此更名竟然是這樣的下場：被他最信任也最友好的日本政府給坑了。\n果然錯誤的政策比貪污可怕，2100萬就這樣打水漂了，還要資助九州水患，核四停建違約賠償金.......夠全國軍公教退休2次.........\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118',
        },
      ],
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
  });
  expect(gql.__finished()).toBe(true);
  expect(result.replies.length).toBeLessThanOrEqual(5); // Reply message API limit
  const carouselReply = result.replies.find(
    (reply): reply is FlexMessage & { contents: { type: 'carousel' } } =>
      reply.type === 'flex' && reply.contents.type === 'carousel'
  );

  // Make TS happy
  /* istanbul ignore if */
  if (!carouselReply) throw new Error('No carouselReply reply in replies');

  const carousel = carouselReply.contents;

  expect(carousel.contents.length).toBeLessThanOrEqual(10); // Flex message carousel 10 bubble limit
  expect(JSON.stringify(carousel).length).toBeLessThan(50 * 1000); // Flex message carousel 50K limit
});

it('articles found with high similarity', async () => {
  gql.__push(apiListArticleResult.twoShortArticles);

  expect(
    await initState({
      context: {
        sessionId: 1497994017447,
        msgs: [{ type: 'text', id: 'abc', text: 'YouTube · 寻找健康人生' }],
      },
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    })
  ).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "text",
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
          "el": "AVvY-yizyCdS-nWhuYWx",
          "ni": true,
        },
      ],
      Array [
        Object {
          "ea": "Search",
          "ec": "Article",
          "el": "AVvY-yizyCdS-nWhuYWy",
          "ni": true,
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('only one article found with high similarity and choose for user', async () => {
  gql.__push(apiListArticleResult.shortArticle);
  gql.__push(apiGetArticleResult.shortArticle);

  expect(
    await initState({
      context: {
        sessionId: 1497994017447,
        msgs: [{ type: 'text', id: 'abc', text: 'YouTube · 寻找健康人生' }],
      },
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    })
  ).toMatchSnapshot();

  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "text",
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
          "el": "AVvY-yizyCdS-nWhuYWx",
          "ni": true,
        },
      ],
      Array [
        Object {
          "ea": "Selected",
          "ec": "Article",
          "el": "AVvY-yizyCdS-nWhuYWx",
        },
      ],
      Array [
        Object {
          "ea": "NoReply",
          "ec": "Article",
          "el": "AVvY-yizyCdS-nWhuYWx",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(2);
});

it('should handle message matches only hyperlinks', async () => {
  gql.__push(apiListArticleResult.hyperlinksArticles);

  expect(
    await initState({
      context: {
        sessionId: 1497994017447,
        msgs: [{ type: 'text', id: 'abc', text: 'YouTube · 寻找健康人生' }],
      },
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    })
  ).toMatchSnapshot();
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "text",
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
          "el": "AVvY-yizyCdS-nWhuYGB",
          "ni": true,
        },
      ],
      Array [
        Object {
          "ea": "Search",
          "ec": "Article",
          "el": "AVvY-yizyCdS-nWhuYGA",
          "ni": true,
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle text not found', async () => {
  gql.__push(apiListArticleResult.notFound);

  MockDate.set('2020-01-01');
  expect(
    await initState({
      context: {
        sessionId: 1497994017447,
        msgs: [
          {
            type: 'text',
            id: 'abc',
            text: 'YouTube · 寻找健康人生 驚！大批香蕉受到愛滋血污染！這種香蕉千萬不要吃！吃到可能會被 ...',
          },
        ],
      },
      userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    })
  ).toMatchSnapshot();
  MockDate.reset();
  expect(gql.__finished()).toBe(true);

  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "MessageType",
          "ec": "UserInput",
          "el": "text",
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

describe('input matches dialogflow intent', () => {
  it('uses dialogflow response when input length < 10', async () => {
    gql.__push(apiListArticleResult.notFound);
    detectDialogflowIntent.mockImplementationOnce(() =>
      Promise.resolve({
        queryResult: {
          fulfillmentText: '歡迎光臨',
          intent: {
            displayName: 'Welcome',
          },
        },
      })
    );

    expect(
      await initState({
        context: {
          sessionId: 1497994017447,
          msgs: [{ type: 'text', id: 'abc', text: '你好' }],
        },
        userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      })
    ).toMatchSnapshot();
    expect(gql.__finished()).toBe(false);
    expect(detectDialogflowIntent).toHaveBeenCalledTimes(1);

    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "MessageType",
            "ec": "UserInput",
            "el": "text",
          },
        ],
        Array [
          Object {
            "ea": "ChatWithBot",
            "ec": "UserInput",
            "el": "Welcome",
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('uses dialogflow response when input length > 10 and intentDetectionConfidence = 1', async () => {
    gql.__push(apiListArticleResult.notFound);
    detectDialogflowIntent.mockImplementationOnce(() =>
      Promise.resolve({
        queryResult: {
          fulfillmentText: '歡迎光臨',
          intent: {
            displayName: 'Welcome',
          },
          intentDetectionConfidence: 1.0,
        },
      })
    );

    expect(
      await initState({
        context: {
          sessionId: 1497994017447,
          msgs: [{ type: 'text', id: 'abc', text: '零一二三四五六七八九十' }],
        },
        userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      })
    ).toMatchSnapshot();
    expect(gql.__finished()).toBe(false);
    expect(detectDialogflowIntent).toHaveBeenCalledTimes(1);

    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "MessageType",
            "ec": "UserInput",
            "el": "text",
          },
        ],
        Array [
          Object {
            "ea": "ChatWithBot",
            "ec": "UserInput",
            "el": "Welcome",
          },
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('search article when input length > 10 and intentDetectionConfidence != 1', async () => {
    gql.__push(apiListArticleResult.notFound);
    detectDialogflowIntent.mockImplementationOnce(() =>
      Promise.resolve({
        queryResult: {
          fulfillmentText: '歡迎光臨',
          intent: {
            displayName: 'Welcome',
          },
          intentDetectionConfidence: 0.87,
        },
      })
    );

    MockDate.set('2020-01-01');
    expect(
      await initState({
        context: {
          sessionId: 1497994017447,
          msgs: [{ type: 'text', id: 'abc', text: '零一二三四五六七八九十' }],
        },
        userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
      })
    ).toMatchSnapshot();
    MockDate.reset();
    expect(gql.__finished()).toBe(true);
    expect(detectDialogflowIntent).toHaveBeenCalledTimes(1);

    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "MessageType",
            "ec": "UserInput",
            "el": "text",
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
});
