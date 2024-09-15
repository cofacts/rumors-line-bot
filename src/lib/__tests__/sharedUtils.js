describe('getArticleURL and extractArticleId', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.SITE_URLS;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('use the default SITE_URL', () => {
    const utils = require('../sharedUtils');
    expect(utils.getArticleURL('AWDZYXxAyCdS-nWhumlz')).toMatchInlineSnapshot(
      `"https://cofacts.tw/article/AWDZYXxAyCdS-nWhumlz"`
    );
  });

  it('use SITE_URL from env variables', () => {
    process.env.SITE_URLS = 'https://cofacts.hacktabl.org';
    const utils = require('../sharedUtils');
    expect(utils.getArticleURL('AWDZYXxAyCdS-nWhumlz')).toMatchInlineSnapshot(
      `"https://cofacts.hacktabl.org/article/AWDZYXxAyCdS-nWhumlz"`
    );
  });

  it('returns empty string when no aritcle ID can be extracted', () => {
    const utils = require('../sharedUtils');
    const invalidMessages = [
      'not valid',
      utils.VIEW_ARTICLE_PREFIX + 'not valid',
      'https://cofacts.g0v.tw/reply/not-article-url',
    ];

    for (const message of invalidMessages) {
      expect(utils.extractArticleId(message)).toBe('');
    }
  });

  it('extracts article successfully', () => {
    process.env.SITE_URLS = 'http://host1,https://host2';
    const utils = require('../sharedUtils');

    const messagesWithArticleId = [
      utils.VIEW_ARTICLE_PREFIX + 'http://host1/article/expected-id',
      'https://host2/article/expected-id',
    ];

    for (const message of messagesWithArticleId) {
      expect(utils.extractArticleId(message)).toBe('expected-id');
    }
  });
});

describe('date-fns', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.LOCALE;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('use the default LOCALE', () => {
    const { format, formatDistanceToNow } = require('../sharedUtils');
    expect(
      formatDistanceToNow(new Date(Date.now() - 86400000))
    ).toMatchInlineSnapshot(`"1 day"`);

    // Automatically switch between absolute date and relative date
    expect(format(new Date(Date.now() - 86400000))).toMatchInlineSnapshot(
      `"1 day ago"`
    );
    expect(format(new Date(612921600000))).toMatchInlineSnapshot(
      `"Jun 4, 1989"`
    );

    // Handles invalid date
    expect(format(new Date(-Infinity))).toMatchInlineSnapshot(`"unknown date"`);
    expect(formatDistanceToNow(new Date('wrong'))).toMatchInlineSnapshot(
      `"unknown time"`
    );
  });

  it('use other locale', () => {
    process.env.LOCALE = 'zh_TW';

    const { format, formatDistanceToNow } = require('../sharedUtils');
    expect(format(new Date(612921600000))).toMatchInlineSnapshot(
      `"1989-06-04"`
    );
    expect(
      formatDistanceToNow(new Date(Date.now() - 86400000))
    ).toMatchInlineSnapshot(`"1 天"`);
  });
});

describe('createTypeWords', () => {
  const { createTypeWords } = require('../sharedUtils');

  it('should return the type words for RUMOR', () => {
    expect(createTypeWords('RUMOR')).toMatchInlineSnapshot(
      `"Contains misinformation"`
    );
  });

  it('should return the type words for NOT_RUMOR', () => {
    expect(createTypeWords('NOT_RUMOR')).toMatchInlineSnapshot(
      `"Contains true information"`
    );
  });

  it('should return the type words for OPINIONATED', () => {
    expect(createTypeWords('OPINIONATED')).toMatchInlineSnapshot(
      `"Contains personal perspective"`
    );
  });

  it('should return the type words for NOT_ARTICLE', () => {
    expect(createTypeWords('NOT_ARTICLE')).toMatchInlineSnapshot(
      `"Invalid request"`
    );
  });

  it('should return the type words for other types', () => {
    expect(createTypeWords('some other type')).toMatchInlineSnapshot(
      `"Undefined"`
    );
  });
});
