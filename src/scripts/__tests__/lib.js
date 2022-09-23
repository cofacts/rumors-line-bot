jest.mock('src/lib/gql');
jest.mock('src/lib/ga');
jest.mock('src/lib/redisClient');
jest.mock('src/webhook/lineClient');
jest.mock('src/lib/sendMessage');

import lib from '../lib';
import SendMessage from 'src/lib/sendMessage';
import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

beforeEach(async () => {
  ga.clearAllMocks();
  gql.__reset();
});

describe('get notification list', () => {
  it('should get notification list', async () => {
    gql.__push({
      data: {
        ListArticles: {
          pageInfo: {
            firstCursor: 'WzE1OTM1OTAzNjgyOTQsIjN2dmsxMGNlYTgxdzEiXQ==',
            lastCursor: 'WzE1NDUyNjQ5NzEwOTUsIjFoendmbnZnYnYwdWkiXQ==',
          },
          totalCount: 199,
        },
      },
    });

    gql.__push({
      data: {
        ListArticles: {
          edges: [
            {
              node: {
                id: 'a1',
                articleReplies: [
                  {
                    createdAt: '2020-06-14T11:57:25.100Z',
                  },
                  {
                    createdAt: '2020-05-29T11:57:25.100Z',
                  },
                ],
              },
              cursor: 'WzE1OTM0Njk4MjQyOTcsIjFmaTdkbGE5d3R3am4iXQ==',
            },
            {
              node: {
                id: 'a2',
                articleReplies: [
                  {
                    createdAt: '2020-05-29T10:32:34.103Z',
                  },
                ],
              },
              cursor: 'WzE1OTA3NDgzNTQxMDMsIjM2bngyN3Z1enhuZXAiXQ==',
            },
            {
              node: {
                articleReplies: [],
              },
              cursor: 'WzE1OTA3NDc3Mjk4MTIsIjJ3aTlkdTlhMnN3MTMiXQ==',
            },
            {
              // ListArticle(repliedAt) includes an article as long as it has one articleReply within the time range
              node: {
                id: 'a3',
                articleReplies: [
                  {
                    createdAt: '2020-05-28T10:22:09.812Z',
                  },
                  {
                    createdAt: '2020-05-27T10:22:09.812Z',
                  },
                  {
                    createdAt: '2020-01-25T10:22:09.812Z',
                  },
                ],
              },
              cursor: 'WzE1OTA1NzE2MTkwNTcsIkFWMXZwMGw0eUNkUy1uV2h1YzRlIl0=',
            },
            {
              node: {
                id: 'a4',
                articleReplies: [
                  {
                    createdAt: '2020-05-26T10:21:32.848Z',
                  },
                ],
              },
              cursor: 'WzE1OTAwNTYyODY3MTksIjE2YW95dXY2dDBjd3oiXQ==',
            },
            {
              node: {
                id: 'a5',
                articleReplies: [
                  {
                    createdAt: '2020-05-26T10:21:32.848Z',
                  },
                ],
              },
              cursor: 'WzE1NDUyNjQ5NzEwOTUsIjFoendmbnZnYnYwdWkiXQ==',
            },
          ],
        },
      },
    });

    const fixtures = [
      {
        userId: 'u2',
        articleId: 'a1',
        createdAt: new Date('2020-01-01T18:10:18.314Z'),
        lastViewedAt: new Date('2020-01-01T18:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a3',
        createdAt: new Date('2020-01-01T21:10:18.314Z'),
        lastViewedAt: new Date('2020-01-01T21:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a4',
        createdAt: new Date('2020-01-01T20:10:18.314Z'),
        lastViewedAt: new Date('2020-01-01T20:10:18.314Z'),
      },
      {
        userId: 'u2',
        articleId: 'a3',
        createdAt: new Date('2020-07-01T23:10:18.314Z'),
        // u2 viewed a3's new reply
        lastViewedAt: new Date('2020-07-01T23:10:18.314Z'),
      },
      {
        userId: 'u3',
        articleId: 'a3',
        createdAt: new Date('2020-01-01T22:10:18.314Z'),
        lastViewedAt: new Date('2020-01-01T22:10:18.314Z'),
      },
    ];

    if (await UserArticleLink.collectionExists()) {
      await (await UserArticleLink.client).drop();
    }

    for (const fixture of fixtures) {
      await UserArticleLink.create(fixture);
    }

    const result = await lib.getNotificationList(
      '2020-05-20T00:00:00.000Z',
      '2020-06-15T00:00:00.000Z'
    );

    expect(result).toMatchSnapshot();
    expect(gql.__finished()).toBe(true);
  });

  it('handles empty ListArticles data', async () => {
    gql.__push({
      data: {
        ListArticles: {
          pageInfo: {
            firstCursor: null,
            lastCursor: null,
          },
          totalCount: 0,
        },
      },
    });

    const result = await lib.getNotificationList(
      '2020-05-20T00:00:00.000Z',
      '2020-06-15T00:00:00.000Z'
    );

    expect(result).toMatchSnapshot();
    expect(gql.__finished()).toBe(true);
  });
});

describe('send notification', () => {
  SendMessage.multicast = jest.fn();
  SendMessage.notify = jest.fn();
  const OLD_ENV = process.env;
  const fixtures = [
    {
      userId: 'u1',
      allowNewReplyUpdate: true,
      newReplyNotifyToken: 'this_is_token',
    },
    {
      userId: 'u2',
      allowNewReplyUpdate: false,
      newReplyNotifyToken: 'this_is_token',
    },
    {
      userId: 'u3',
      allowNewReplyUpdate: true,
      newReplyNotifyToken: 'this_is_token',
    },
  ];

  const list = {
    u1: ['a3', 'a4'],
    u2: ['a1', 'a3'],
    u3: ['a3'],
  };
  beforeEach(async () => {
    SendMessage.notify.mockClear();
    SendMessage.multicast.mockClear();

    process.env = { ...OLD_ENV };
    delete process.env.NOTIFY_METHOD;

    if (await UserSettings.collectionExists()) {
      await (await UserSettings.client).drop();
    }
    for (const fixture of fixtures) {
      await UserSettings.create(fixture);
    }
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('should send notification by multicast api', async () => {
    process.env.NOTIFY_METHOD = 'PUSH_MESSAGE';

    await lib.sendNotification(list);
    expect(SendMessage.notify).not.toHaveBeenCalled();
    expect(SendMessage.multicast).toHaveBeenCalledTimes(1);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('should send notification by LINE Notify', async () => {
    process.env.NOTIFY_METHOD = 'LINE_NOTIFY';

    await lib.sendNotification(list);
    // called twice because u2 doesn't allow to send notification
    expect(SendMessage.notify).toHaveBeenCalledTimes(2);
    expect(SendMessage.multicast).not.toHaveBeenCalled();
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
  });

  it('handles empty list', async () => {
    process.env.NOTIFY_METHOD = 'PUSH_MESSAGE';

    await lib.sendNotification({});
    expect(SendMessage.notify).not.toHaveBeenCalled();
    expect(SendMessage.multicast).not.toHaveBeenCalled();
    expect(ga.sendMock).not.toHaveBeenCalled();
  });
});

it('test getUserArticleLinksBatch', async () => {
  const fixtures = [
    {
      userId: 'u2',
      articleId: 'a1',
      createdAt: new Date('2020-01-01T18:10:18.314Z'),
      lastViewedAt: new Date('2020-01-01T18:10:18.314Z'),
    },
    {
      userId: 'u1',
      articleId: 'a3',
      createdAt: new Date('2020-01-01T21:10:18.314Z'),
      lastViewedAt: new Date('2020-01-01T21:10:18.314Z'),
    },
    {
      userId: 'u2',
      articleId: 'a3',
      createdAt: new Date('2020-07-01T23:10:18.314Z'),
      lastViewedAt: new Date('2020-07-01T23:10:18.314Z'),
    },
  ];

  if (await UserArticleLink.collectionExists()) {
    await (await UserArticleLink.client).drop();
  }

  for (const fixture of fixtures) {
    await UserArticleLink.create(fixture);
  }
  const articleIds = ['a1', 'a2', 'a3', 'a4'];
  const generator = await lib.getUserArticleLinksBatch(articleIds, 2);
  const result1 = await generator.next();
  expect(result1.value.length).toBe(2);
  expect(result1.done).toEqual(false);
  const result2 = await generator.next();
  expect(result2.value.length).toBe(1);
  expect(result2.done).toEqual(false);
  const result3 = await generator.next();
  expect(result3.value).toMatchInlineSnapshot(`undefined`);
  expect(result3.done).toEqual(true);
});
