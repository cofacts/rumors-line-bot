const joinGroup = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'join',
  groupId: 'C4a1',
  webhookEvent: {
    mode: 'active',
    timestamp: 1462629479859,
    source: {
      type: 'group',
      groupId: 'C4a1',
    },
  },
};

const textMessage = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'message',
  groupId: 'C4a1',
  webhookEvent: {
    mode: 'active',
    timestamp: 1462629479859,
    message: {
      type: 'text',
    },
    source: {
      type: 'group',
      groupId: 'C4a1',
    },
  },
};

const expiredTextMessage = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'message',
  groupId: 'C4a1',
  webhookEvent: {
    mode: 'active',
    timestamp: 612921600000,
    message: {
      type: 'text',
    },
    source: {
      type: 'group',
      groupId: 'C4a1',
    },
  },
};

export default { joinGroup, textMessage, expiredTextMessage };
