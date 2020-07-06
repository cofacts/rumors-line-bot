jest.mock('src/lib/gql');
jest.mock('src/lib/ga');
jest.mock('src/lib/redisClient');
jest.mock('src/webhook/lineClient');
jest.mock('src/lib/sendMessage');

import lib from '../lib';
import SendMessage from 'src/lib/sendMessage';
import Client from 'src/database/mongoClient';
import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

beforeEach(async () => {
  ga.clearAllMocks();
  gql.__reset();
});
afterAll(async () => {
  await (await Client.getInstance()).close();
});
describe('get notification list', () => {
  it('should get notification list', async () => {
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
            },
            {
              node: {
                articleReplies: [],
              },
            },
            {
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
                    createdAt: '2020-05-26T10:22:09.812Z',
                  },
                  {
                    createdAt: '2020-05-25T10:22:09.812Z',
                  },
                ],
              },
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
      },
      {
        userId: 'u1',
        articleId: 'a3',
        createdAt: new Date('2020-01-01T21:10:18.314Z'),
      },
      {
        userId: 'u1',
        articleId: 'a4',
        createdAt: new Date('2020-01-01T20:10:18.314Z'),
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
      data: {},
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

    if (await UserArticleLink.collectionExists()) {
      await (await UserArticleLink.client).drop();
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
    // called twice because u2 doesn't allow to send notification
    expect(ga.sendMock).toHaveBeenCalledTimes(2);
  });

  it('should send notification by LINE Notify', async () => {
    process.env.NOTIFY_METHOD = 'LINE_NOTIFY';

    await lib.sendNotification(list);
    // called twice because u2 doesn't allow to send notification
    expect(SendMessage.notify).toHaveBeenCalledTimes(2);
    expect(SendMessage.multicast).not.toHaveBeenCalled();
    expect(ga.sendMock).toHaveBeenCalledTimes(2);
  });

  it('handles empty list', async () => {
    process.env.NOTIFY_METHOD = 'PUSH_MESSAGE';

    await lib.sendNotification({});
    // called twice because u2 doesn't allow to send notification
    expect(SendMessage.notify).not.toHaveBeenCalled();
    expect(SendMessage.multicast).not.toHaveBeenCalled();
    expect(ga.sendMock).not.toHaveBeenCalled();
  });
});
