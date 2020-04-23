jest.mock('src/lib/gql');
jest.mock('src/lib/ga');

import MockDate from 'mockdate';
import initState from '../initState';
import * as apiResult from '../__fixtures__/initState';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

import { REASON_PREFIX } from 'src/lib/sharedUtils';

beforeEach(() => {
  ga.clearAllMocks();
  gql.__reset();
});

it('article found', async () => {
  gql.__push(apiResult.longArticle);

  const input = {
    data: {
      sessionId: 1497994017447,
    },
    state: '__INIT__',
    event: {
      type: 'message',
      input:
        '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入',
      timestamp: 1497994016356,
      message: {
        type: 'text',
        id: '6270464463537',
        text:
          '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入',
      },
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await initState(input)).toMatchSnapshot();
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
  gql.__push(apiResult.twelveLongArticles);

  const input = {
    data: {
      sessionId: 1502477506267,
    },
    state: '__INIT__',
    event: {
      type: 'message',
      input:
        '這樣的大事國內媒體竟然不敢報導！\n我國駐日代表將原「中華民國」申請更名為「台灣」結果被日本裁罰，須繳納7000萬日圓（合約台幣2100萬元）高額稅賦(轉載中時電子報）\n\n我駐日代表謝長廷將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭自認友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元）高額稅賦...民進黨沒想到如此更名竟然是這樣的下場：被他最信任也最友好的日本政府給坑了。\n果然錯誤的政策比貪污可怕，2100萬就這樣打水漂了，還要資助九州水患，核四停建違約賠償金.......夠全國軍公教退休2次.........\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118',
      timestamp: 1502477505309,
      message: {
        type: 'text',
        id: '6530038889933',
        text:
          '這樣的大事國內媒體竟然不敢報導！\n我國駐日代表將原「中華民國」申請更名為「台灣」結果被日本裁罰，須繳納7000萬日圓（合約台幣2100萬元）高額稅賦(轉載中時電子報）\n\n我駐日代表謝長廷將原「中華民國」申請更名為「台灣」，自認得意之時，結果遭自認友好日本國給出賣了，必須繳納7000萬日圓（合約台幣2100萬元）高額稅賦...民進黨沒想到如此更名竟然是這樣的下場：被他最信任也最友好的日本政府給坑了。\n果然錯誤的政策比貪污可怕，2100萬就這樣打水漂了，還要資助九州水患，核四停建違約賠償金.......夠全國軍公教退休2次.........\n\nhttp://www.chinatimes.com/newspapers/20170617000318-260118',
      },
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    isSkipUser: false,
  };

  const result = await initState(input);
  expect(gql.__finished()).toBe(true);
  expect(result.replies.length).toBeLessThanOrEqual(5); // Reply message API limit
  const carousel = result.replies.find(({ type }) => type === 'flex').contents;
  expect(carousel.type).toBe('carousel');
  expect(carousel.contents.length).toBeLessThanOrEqual(10); // Flex message carousel 10 bubble limit
  expect(JSON.stringify(carousel).length).toBeLessThan(50 * 1000); // Flex message carousel 50K limit
});

it('articles found with high similarity', async () => {
  gql.__push(apiResult.twoShortArticles);

  const input = {
    data: {
      sessionId: 1497994017447,
    },
    state: '__INIT__',
    event: {
      type: 'message',
      input: 'YouTube · 寻找健康人生',
      timestamp: 1497994016356,
      message: {
        type: 'text',
        id: '6270464463537',
        text: 'YouTube · 寻找健康人生',
      },
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await initState(input)).toMatchSnapshot();
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

it('only one article found with high similarity', async () => {
  gql.__push(apiResult.shortArticle);

  const input = {
    data: {
      sessionId: 1497994017447,
    },
    state: '__INIT__',
    event: {
      type: 'message',
      input: 'YouTube · 寻找健康人生',
      timestamp: 1497994016356,
      message: {
        type: 'text',
        id: '6270464463537',
        text: 'YouTube · 寻找健康人生',
      },
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await initState(input)).toMatchSnapshot();
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

it('should handle text not found', async () => {
  gql.__push(apiResult.notFound);

  const input = {
    data: {
      sessionId: 1497994017447,
    },
    state: '__INIT__',
    event: {
      type: 'message',
      input:
        'YouTube · 寻找健康人生 驚！大批香蕉受到愛滋血污染！這種香蕉千萬不要吃！吃到可能會被 ...',
      timestamp: 1497994016356,
      message: {
        type: 'text',
        id: '6270464463537',
        text:
          'YouTube · 寻找健康人生 驚！大批香蕉受到愛滋血污染！這種香蕉千萬不要吃！吃到可能會被 ...',
      },
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  MockDate.set('2020-01-01');
  expect(await initState(input)).toMatchSnapshot();
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

it('should handle image not found', async () => {
  gql.__push(apiResult.notFound);

  const input = {
    data: {
      sessionId: 1497994017447,
    },
    state: '__INIT__',
    event: {
      type: 'message',
      input: 'OCR text OCR text OCR text',
      timestamp: 1497994016356,
      message: {
        type: 'image',
      },
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  expect(await initState(input)).toMatchSnapshot();
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
          "el": "ArticleNotFound",
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
    state: '__INIT__',
    event: {
      type: 'message',
      input: REASON_PREFIX + 'My reason',
      timestamp: 1497994016356,
    },
    userId: 'Uc76d8ae9ccd1ada4f06c4e1515d46466',
    replies: undefined,
    isSkipUser: false,
  };

  await expect(initState(input)).rejects.toMatchInlineSnapshot(
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
    state: '__INIT__',
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

  await expect(initState(input)).rejects.toMatchInlineSnapshot(
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
    state: '__INIT__',
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
  expect(await initState(input)).toMatchSnapshot();
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
    state: '__INIT__',
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
  expect(await initState(input)).toMatchSnapshot();
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
