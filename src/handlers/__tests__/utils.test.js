import { checkSingleUrl } from '../utils';

describe('createPostbackAction()', () => {
  it('should return postback message body');
});

describe('createFeedbackWords()', () => {
  it('should create empty feedback words');
  it('should create positive feedback words');
  it('should create negative feedback words');
});
describe('createReferenceWords()', () => {});

describe('checkSingleUrl()', () => {
  it('should detect a info-less text [1]', () => {
    let text = 'http://google.com';
    expect(checkSingleUrl(text)).toBe(true);
  });

  it('should detect a info-less text [2]', () => {
    let text = '看到連結 http://google.com 請不要點開';
    expect(checkSingleUrl(text)).toBe(true);
  });

  it('should detect a info-less text [3]', () => {
    let text =
      '這連結好棒 https://today.line.me/TW/article/0BwyWj?utm_source=lineshare';
    expect(checkSingleUrl(text)).toBe(true);
  });

  it('should detect a normal text [1]', () => {
    let text = `如果你真的直接就去改資費方案的話，恐怕根本沒省到，
      甚至電話費還反而變貴了！https://today.line.me/TW/article/0BwyWj?utm_source=lineshare`;
    expect(checkSingleUrl(text)).toBe(false);
  });

  /**
   *  Can't parse url without ^http.
   */
  xit('should detect a text with a single url', () => {
    let text = '不要點開 google.com';
    let newText = checkSingleUrl(text);
    console.log({ text, newText });
  });
});
