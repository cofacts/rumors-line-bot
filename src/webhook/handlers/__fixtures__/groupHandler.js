const joinGroup = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'join',
  mode: 'active',
  timestamp: 1462629479859,
  source: {
    type: 'group',
    groupId: 'C4a1',
  },
};

const leaveGroup = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'leave',
  mode: 'active',
  timestamp: 1462629479859,
  source: {
    type: 'group',
    groupId: 'C4a1',
  },
};

const textMessage = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'message',
  mode: 'active',
  timestamp: 1462629479859,
  message: {
    type: 'text',
  },
  source: {
    type: 'group',
    groupId: 'C4a1',
  },
};

const expiredTextMessage = {
  replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
  type: 'message',
  mode: 'active',
  timestamp: 612921600000,
  message: {
    type: 'text',
  },
  source: {
    type: 'group',
    groupId: 'C4a1',
  },
};

export default { joinGroup, leaveGroup, textMessage, expiredTextMessage };
