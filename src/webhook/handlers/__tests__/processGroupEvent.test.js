jest.mock('src/lib/ga');
jest.mock('src/lib/gql');
jest.mock('src/webhook/lineClient');
jest.mock('../groupMessage');

import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import lineClient from 'src/webhook/lineClient';
import MockDate from 'mockdate';

import processGroupEvent from '../processGroupEvent';
import groupMessage from '../groupMessage';

import messageEvent from '../__fixtures__/processGroupEvent';

beforeEach(() => {
  ga.clearAllMocks();
  gql.__reset();
  lineClient.get.mockClear();
  lineClient.post.mockClear();
  groupMessage.mockClear();
});

beforeAll(async () => {
  MockDate.set(1462629480000);
});

afterAll(async () => {
  MockDate.reset();
});

// afterEach(() => {
// });

describe('processGroupEvent', () => {
  it('should handle join event', async () => {
    const { type, replyToken, ...otherFields } = messageEvent.joinGroup;
    const param = {
      req: {},
      replyToken,
      type,
      groupId: otherFields.source.groupId,
      otherFields: { ...otherFields },
    };
    lineClient.get.mockImplementationOnce(() => ({
      count: 55987,
    }));

    expect(await processGroupEvent(param)).toMatchSnapshot();
    expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "C4a1",
          "N/A",
          "",
          "group",
        ],
      ]
    `);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "Join",
            "ec": "Group",
            "ev": 1,
          },
        ],
      ]
    `);
    expect(ga.setMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "cd2",
          55987,
        ],
      ]
    `);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
    expect(lineClient.get).toHaveBeenCalledTimes(1);
    expect(groupMessage).toHaveBeenCalledTimes(0);
  });

  it('should handle leave event', async () => {
    const { type, replyToken, ...otherFields } = messageEvent.leaveGroup;
    const param = {
      req: {},
      replyToken,
      type,
      groupId: otherFields.source.groupId,
      otherFields: { ...otherFields },
    };
    lineClient.get.mockImplementationOnce(() => ({
      count: 55987,
    }));

    expect(await processGroupEvent(param)).toMatchSnapshot();
    expect(ga.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "C4a1",
          "N/A",
          "",
          "group",
        ],
      ]
    `);
    expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "ea": "Leave",
            "ec": "Group",
            "ev": -1,
          },
        ],
      ]
    `);
    expect(ga.setMock).toHaveBeenCalledTimes(0);
    expect(ga.sendMock).toHaveBeenCalledTimes(1);
    expect(lineClient.get).toHaveBeenCalledTimes(0);
    expect(groupMessage).toHaveBeenCalledTimes(0);
  });

  it('should handle text message event', async () => {
    const { type, replyToken, ...otherFields } = messageEvent.textMessage;
    const param = {
      req: {},
      replyToken,
      type,
      groupId: otherFields.source.groupId,
      otherFields: { ...otherFields },
    };
    groupMessage.mockImplementationOnce(() => ({
      groupMessageResult: 'groupMessage result',
    }));

    expect(await processGroupEvent(param)).toMatchSnapshot();
    expect(groupMessage.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "input": undefined,
            "message": Object {
              "type": "text",
            },
            "mode": "active",
            "source": Object {
              "groupId": "C4a1",
              "type": "group",
            },
            "timestamp": 1462629479859,
            "type": "message",
          },
          "C4a1",
        ],
      ]
    `);
  });

  it('should reject expired text message event', async () => {
    const {
      type,
      replyToken,
      ...otherFields
    } = messageEvent.expiredTextMessage;
    const param = {
      req: {},
      replyToken,
      type,
      groupId: otherFields.source.groupId,
      otherFields: { ...otherFields },
    };
    groupMessage.mockImplementationOnce(() => ({
      groupMessageResult: 'groupMessage result',
    }));

    await expect(processGroupEvent(param)).rejects.toMatchInlineSnapshot(
      `[Error: Event expired]`
    );
    expect(groupMessage.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          Object {
            "input": undefined,
            "message": Object {
              "type": "text",
            },
            "mode": "active",
            "source": Object {
              "groupId": "C4a1",
              "type": "group",
            },
            "timestamp": 612921600000,
            "type": "message",
          },
          "C4a1",
        ],
      ]
    `);
  });

  it('should handle groupMessage error', async () => {
    const { type, replyToken, ...otherFields } = messageEvent.textMessage;
    const param = {
      req: {},
      replyToken,
      type,
      groupId: otherFields.source.groupId,
      otherFields: { ...otherFields },
    };
    groupMessage.mockImplementationOnce(() =>
      Promise.reject(new Error('Foo error'))
    );

    expect(await processGroupEvent(param)).toMatchSnapshot();
    expect(groupMessage).toHaveBeenCalledTimes(1);
  });
});
