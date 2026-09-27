jest.mock('src/webhook/lineClient');

import {
  createPostbackAction,
  createFeedbackWords,
  createReferenceWords,
  ellipsis,
  createArticleShareBubble,
  createFlexMessageText,
  createHighlightContents,
  createReplyMessages,
  getLineContentProxyURL,
  setNewContext,
  setReplyToken,
  consumeReplyTokenInfo,
} from '../utils';
import MockDate from 'mockdate';
import { read } from 'src/lib/jwt';
import { sleep } from 'src/lib/sharedUtils';
import redis from 'src/lib/redisClient';
import lineClient from 'src/webhook/lineClient';

describe('createArticleShareBubble()', () => {
  it('should uri size less then 1000', () => {
    const articleUrl =
      'https://cofacts.hacktabl.org/article/AWDZYXxAyCdS-nWhumlz';

    const result = createArticleShareBubble(articleUrl);
    result.footer.contents.forEach(({ action }) => {
      expect(action.uri.length).toBeLessThan(1000);
      expect(action.uri).toMatchSnapshot();
    });
  });
});

describe('ellipsis()', () => {
  it('should not ellipsis when text is short', () => {
    expect(ellipsis('12345', 10)).toBe('12345');
  });

  it('should ellipsis when text is too long', () => {
    const limit = 5;
    const processed = ellipsis('1234567890', limit);
    expect(processed).toHaveLength(limit);
    expect(processed).toMatchSnapshot();
  });

  it('should properly cut emojis', () => {
    expect(ellipsis('🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈🏳️‍🌈', 5)).toMatchSnapshot();
  });

  it('should be able to customize ellipsis', () => {
    expect(ellipsis('1234567890', 5, '')).toBe('12345');
  });
});

describe('createPostbackAction()', () => {
  it('should return postback message body', () => {
    expect(
      createPostbackAction(
        '閱讀此回應',
        3,
        'I chose this',
        1519019701265,
        'some-id'
      )
    ).toMatchSnapshot();
  });
});

describe('createFeedbackWords()', () => {
  it('should create empty feedback words', () => {
    expect(createFeedbackWords(0, 0)).toMatchSnapshot();
  });
  it('should create positive feedback words', () => {
    expect(createFeedbackWords(3, 0)).toMatchSnapshot();
  });
  it('should create negative feedback words', () => {
    expect(createFeedbackWords(0, 2)).toMatchSnapshot();
  });
  it('should create both feedback words', () => {
    expect(createFeedbackWords(1, 2)).toMatchSnapshot();
  });
});

describe('createReferenceWords()', () => {
  it('should create reference for rumors', () => {
    expect(
      createReferenceWords({
        reference: 'This is a reference',
        type: 'RUMOR',
        createdAt: '2018-01-09T05:52:12.658Z',
      })
    ).toMatchSnapshot();
  });
  it('should create reference for opinions', () => {
    expect(
      createReferenceWords({
        reference: 'This is refering to different opinions',
        type: 'OPINIONATED',
        createdAt: '2018-01-09T05:52:12.658Z',
      })
    ).toMatchSnapshot();
  });
});

describe('createFlexMessageText', () => {
  it('should create a text for flex message', () => {
    expect(
      createFlexMessageText(
        '計程車上有裝悠遊卡感應器，老人悠悠卡可以享受優惠部分由政府補助，不影響司機收入，下車時使用老人悠遊卡，跳錶車資105元，優惠32元，只扣73元，哈哈，這是屬於我們的福利，與大家分享，可以善加利用！=7折，朋友使用ok'
      )
    ).toMatchSnapshot();
  });

  it('should handle the situation without input', () => {
    expect(createFlexMessageText()).toMatchSnapshot();
  });
});

describe('createHighlightContents', () => {
  it('should create a highlight flex message', () => {
    expect(
      createHighlightContents({ text: '<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去' })
    ).toMatchSnapshot();

    expect(
      createHighlightContents({
        text: '全世界有<HIGHLIGHT>成千上萬</HIGHLIGHT><HIGHLIGHT>蜜蜂</HIGHLIGHT>',
        hyperlinks: [
          {
            summary:
              '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
            title: '<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
          },
        ],
      })
    ).toMatchSnapshot();

    expect(
      createHighlightContents({
        text: '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
        hyperlinks: [
          {
            summary: null,
            title: null,
          },
        ],
      })
    ).toMatchSnapshot();

    expect(
      createHighlightContents({
        text: null,
        hyperlinks: [
          {
            summary:
              '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
            title: '<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
          },
          {
            summary:
              '<HIGHLIGHT>計程車</HIGHLIGHT>上有裝悠遊卡<HIGHLIGHT>感應器</HIGHLIGHT>',
            title: '<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
          },
          {
            summary:
              '不影響<HIGHLIGHT>司機收入</HIGHLIGHT>，下車時使用老人悠遊卡',
            title: '下車時使用老人悠遊卡',
          },
        ],
      })
    ).toMatchSnapshot();
    expect(
      createHighlightContents({
        text: null,
        hyperlinks: [
          {
            summary: null,
            title: '<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
          },
          {
            summary: null,
            title:
              '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>',
          },
        ],
      })
    ).toMatchSnapshot();
  });

  it('should limit letters size', () => {
    const { contents: result } = createHighlightContents(
      {
        text: '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
      },
      '',
      10
    );
    let lettersLength = 0;
    result.forEach((s) => (lettersLength += s.text.length));
    // console.log('Letters length:' + lettersLength);
    expect(lettersLength).toBeLessThanOrEqual(10 + 3); // +3 for '...' at the end of message
  });

  it('should limit contents size', () => {
    const { contents: result } = createHighlightContents(
      {
        text: '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
      },
      '',
      100000, // don't limit letters
      500
    );
    // console.log('Contents length:' + JSON.stringify(result).length);
    expect(JSON.stringify(result).length).toBeLessThanOrEqual(500 + 3); // +3 for '...' at the end of message
  });

  it('should handle the situation without highlight', () => {
    expect(
      createHighlightContents(undefined, 'Original text')
    ).toMatchSnapshot();
  });

  it('should handle the situation without input', () => {
    expect(createHighlightContents()).toMatchSnapshot();
  });

  it('should handle line-bot#220 issue', () => {
    expect(
      createHighlightContents(
        {
          text: null,
          hyperlinks: [],
        },
        'Original text'
      )
    ).toMatchSnapshot();
  });
});

describe('createReplyMessages()', () => {
  it('should return reply messages', () => {
    const reply = {
      type: 'RUMOR',
      reference:
        'http://www.mygopen.com/2017/06/blog-post_26.html\n神奇的地瓜葉？搭配鮮奶遠離三高？謠言讓醫生說：有痛風或是腎臟不好的人要小心！',
      text: '基本上地瓜葉其實單吃就有效果，牛奶、豆漿可加可不加，民眾不用迷信。 三高或是糖尿病的患者還是要搭配醫生的治療，不能單靠吃地瓜葉就想將身體調養好，民眾千萬要注意。\n另外地瓜葉內還有鉀和鈉，對於有痛風或是腎臟不好的民眾反而會造成負擔，因此並不建議食用。',
      createdAt: '2018-01-09T05:52:12.658Z',
    };
    const article = { replyCount: 1, createdAt: '2018-01-02T05:52:12.658Z' };
    const selectedArticleId = '2sn80q5l5mzi0';
    expect(
      createReplyMessages(reply, article, selectedArticleId)
    ).toMatchSnapshot();
  });
});

describe('getLineContentProxyURL()', () => {
  it('should return line content proxy url', () => {
    const messageId = '578742384791';
    MockDate.set('2020-01-01');
    process.env.RUMORS_LINE_BOT_URL = 'https://testlinebot.cofacts';
    const url = getLineContentProxyURL(messageId, 'image');
    expect(url).toMatchSnapshot();
    const token = url.split('?token=')[1];
    expect(read(token).messageId).toBe(messageId);
    expect(read(token).messageType).toBe('image');
    MockDate.reset();
    delete process.env.RUMORS_LINE_BOT_URL;
  });
});

describe('setReplyToken()', () => {
  beforeEach(() => {
    lineClient.post.mockClear();
  });

  it(
    'should only send one timeout reply token collector when called multiple times',
    async () => {
      const userId = 'userId';
      await setNewContext(userId, { sessionId: 2 * 2 * 3 * 3 * 3 * 83 });
      await setReplyToken(userId, 'replyToken1'); // This reply token should be replaced by the next one
      await sleep(1000);
      await setReplyToken(userId, 'replyToken2');
      await sleep(60 * 1000); // Wait until timeout

      // Expect no more reply token in Redis
      const nonExistToken = await consumeReplyTokenInfo(userId);
      expect(nonExistToken).toBeNull();

      // Expect replyToken2 is used in the timeout reply token collector message
      expect(lineClient.post.mock.calls).toHaveLength(1);
      expect(lineClient.post.mock.calls[0]).toMatchInlineSnapshot(`
        Array [
          "/message/reply",
          Object {
            "messages": Array [
              Object {
                "altText": "I am still processing your request. Please wait.",
                "contents": Object {
                  "body": Object {
                    "contents": Array [
                      Object {
                        "text": "I am still processing your request. Please wait.",
                        "type": "text",
                        "wrap": true,
                      },
                    ],
                    "layout": "vertical",
                    "type": "box",
                  },
                  "type": "bubble",
                },
                "quickReply": Object {
                  "items": Array [
                    Object {
                      "action": Object {
                        "data": "{\\"state\\":\\"CONTINUE\\",\\"sessionId\\":8964}",
                        "displayText": "OK, proceed.",
                        "label": "OK, proceed.",
                        "type": "postback",
                      },
                      "type": "action",
                    },
                  ],
                },
                "type": "flex",
              },
            ],
            "replyToken": "replyToken2",
          },
        ]
      `);

      // Cleanup
      await redis.del(userId);
    },
    70 * 1000 /* Must be longer than reply token timeout */
  );
});
