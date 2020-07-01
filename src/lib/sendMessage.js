import lineClient from 'src/webhook/lineClient';
import lineNotify from 'src/lib/lineNotify';

const notify = async (token, message) => {
  lineNotify(token, { message: message });
};

// https://developers.line.biz/en/reference/messaging-api/#send-multicast-message
const multicast = async (userIdList, message) => {
  lineClient('/message/multicast', {
    to: userIdList,
    messages: [{ type: 'text', text: message }],
  });
};

// https://developers.line.biz/en/reference/messaging-api/#send-push-message
const push = async (userId, message) => {
  lineClient('/message/push', {
    to: userId,
    messages: [{ type: 'text', text: message }],
  });
};

export default {
  notify,
  multicast,
  push,
};
