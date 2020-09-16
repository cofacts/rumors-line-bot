import {
  createPostbackAction,
  createFeedbackWords,
  createReferenceWords,
  ellipsis,
  createArticleShareBubble,
  createFlexMessageText,
  createTypeWords,
  createHighlightContents,
} from '../utils';

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
      })
    ).toMatchSnapshot();
  });
  it('should create reference for opinions', () => {
    expect(
      createReferenceWords({
        reference: 'This is refering to different opinions',
        type: 'OPINIONATED',
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

describe('createTypeWords', () => {
  it('should return the type words for RUMOR', () => {
    expect(createTypeWords('RUMOR')).toMatchSnapshot();
  });

  it('should return the type words for NOT_RUMOR', () => {
    expect(createTypeWords('NOT_RUMOR')).toMatchSnapshot();
  });

  it('should return the type words for OPINIONATED', () => {
    expect(createTypeWords('OPINIONATED')).toMatchSnapshot();
  });

  it('should return the type words for NOT_ARTICLE', () => {
    expect(createTypeWords('NOT_ARTICLE')).toMatchSnapshot();
  });

  it('should return the type words for other types', () => {
    expect(createTypeWords('some other type')).toMatchSnapshot();
  });
});

describe('createHighlightContents', () => {
  it('should create a highlight flex message', () => {
    expect(
      createHighlightContents({ text: '<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去' })
    ).toMatchSnapshot();

    expect(
      createHighlightContents({
        text:
          '全世界有<HIGHLIGHT>成千上萬</HIGHLIGHT><HIGHLIGHT>蜜蜂</HIGHLIGHT>',
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
        text:
          '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
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
    const result = createHighlightContents(
      {
        text:
          '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
      },
      '',
      10
    );
    let lettersLength = 0;
    result.forEach(s => (lettersLength += s.text.length));
    // console.log('Letters length:' + lettersLength);
    expect(lettersLength).toBeLessThanOrEqual(10 + 3); // +3 for '...' at the end of message
  });

  it('should limit contents size', () => {
    const result = createHighlightContents(
      {
        text:
          '全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去全<HIGHLIGHT>世界</HIGHLIGHT>有成千上萬<HIGHLIGHT>蜜蜂</HIGHLIGHT>逐漸死去',
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
});
