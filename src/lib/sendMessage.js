import lineClient from 'src/webhook/lineClient';
import lineNotify from 'src/lib/lineNotify';

/**
 * https://notify-bot.line.me/doc/en/
 * @param {string} token
 * @param {string} message
 */
const notify = async (token, message) => {
  lineNotify(token, { message: message });
};

/**
 * https://developers.line.biz/en/reference/messaging-api/#send-multicast-message
 * @param {string[]} userIds
 * @param {object[]} messages - Array of line message objects, max size:5
 */
const multicast = (userIds, messages) =>
  lineClient.post('/message/multicast', {
    to: userIds,
    messages: messages,
  });

/**
 * https://developers.line.biz/en/reference/messaging-api/#send-push-message
 * @param {string} userId
 * @param {object[]} messages - Array of line message objects, max size:5
 */
const push = (userId, messages) =>
  lineClient.post('/message/push', {
    to: userId,
    messages: messages,
  });

export default {
  notify,
  multicast,
  push,
};
