describe('Test SITE_URL', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    delete process.env.SITE_URL;
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('use the default SITE_URL', () => {
    const utils = require('../sharedUtils');
    expect(utils.getArticleURL('AWDZYXxAyCdS-nWhumlz')).toMatchInlineSnapshot(
      `"https://cofacts.g0v.tw/article/AWDZYXxAyCdS-nWhumlz"`
    );
  });

  it('use SITE_URL from env variables', () => {
    process.env.SITE_URL = 'https://cofacts.hacktabl.org';
    const utils = require('../sharedUtils');
    expect(utils.getArticleURL('AWDZYXxAyCdS-nWhumlz')).toMatchInlineSnapshot(
      `"https://cofacts.hacktabl.org/article/AWDZYXxAyCdS-nWhumlz"`
    );
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
    expect(format(new Date(612921600000))).toMatchInlineSnapshot(
      `"06/04/1989, 12:00 AM"`
    );
    expect(
      formatDistanceToNow(new Date(Date.now() - 86400000))
    ).toMatchInlineSnapshot(`"1 day"`);
  });

  it('use other locale', () => {
    process.env.LOCALE = 'zh_TW';

    const { format, formatDistanceToNow } = require('../sharedUtils');
    expect(format(new Date(612921600000))).toMatchInlineSnapshot(
      `"89-06-04 上午 12:00"`
    );
    expect(
      formatDistanceToNow(new Date(Date.now() - 86400000))
    ).toMatchInlineSnapshot(`"1 天"`);
  });
});
