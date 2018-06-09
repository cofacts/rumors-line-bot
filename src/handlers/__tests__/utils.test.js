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

describe('isNonsenseText()', () => {
  it('should detect a info-less text [1]', () => {
    let text = 'http://google.com';
    expect(isNonsenseText(text)).toBe(true);
  });

  it('should detect a info-less text [2]', () => {
    let text = '看到連結 http://google.com 請不要點開';
    expect(isNonsenseText(text)).toBe(true);
  });

  it('should detect a info-less text [3]', () => {
    let text =
      '這連結好棒 https://today.line.me/TW/article/0BwyWj?utm_source=lineshare';
    expect(isNonsenseText(text)).toBe(true);
  });

  it('should detect a normal text [1]', () => {
    let text = `如果你真的直接就去改資費方案的話，恐怕根本沒省到，
      甚至電話費還反而變貴了！https://today.line.me/TW/article/0BwyWj?utm_source=lineshare`;
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
