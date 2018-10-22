import {
  createPostbackAction,
  createFeedbackWords,
  isNonsenseText,
  createReferenceWords,
} from '../utils';

describe('createPostbackAction()', () => {
  it('should return postback message body', () => {
    expect(
      createPostbackAction('閱讀此回應', 3, 1519019701265)
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

// According to 20181017 meeting note, we chose to remove limitation temporarily.
xdescribe('isNonsenseText()', () => {
  it('should detect a info-less text [1]', () => {
    // https://cofacts.g0v.tw/article/AV84hj72yCdS-nWhuhxh
    let text = '這個人是不是在做援交的 請分析';
    expect(isNonsenseText(text)).toBe(true);
  });

  it('should detect a info-less text [2]', () => {
    // https://cofacts.g0v.tw/article/AV9MDX05yCdS-nWhuh73
    let text = '米飯 放涼 抗癌';
    expect(isNonsenseText(text)).toBe(true);
  });

  it('should detect a info-less text [3]', () => {
    // https://cofacts.g0v.tw/reply/njr6amQBbZnN2I-EfJfV
    let text = '嗨，請問蔡英文是同性戀，是真的嗎？';
    expect(isNonsenseText(text)).toBe(true);
  });

  it('should detect a normal text [1]', () => {
    let text = `如果你真的直接就去改資費方案的話，恐怕根本沒省到，
      甚至電話費還反而變貴了！https://today.line.me/TW/article/0BwyWj?utm_source=lineshare`;
    expect(isNonsenseText(text)).toBe(false);
  });

  it('should allow a normal text [2]', () => {
    let text = `http://goo.gl/3pZNro`;
    expect(isNonsenseText(text)).toBe(false);
  });

  /**
   *  Can't parse url without ^http.
   */
  xit('should detect a text with a single url', () => {
    let text = '不要點開 google.com';
    let newText = isNonsenseText(text);
    console.log({ text, newText });
  });
});
