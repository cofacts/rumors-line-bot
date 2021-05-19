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
 * Split large array into list of batches, with max size being batchSize for each batch
 * @param {Array<*>} array
 * @param {number} batchSize
 * @returns {Array<Array<*>>}
 */
function batch(array, batchSize) {
  return array.reduce(
    (batches, item) => {
      if (batches[batches.length - 1].length >= batchSize) {
        batches.push([]);
      }
      batches[batches.length - 1].push(item);
      return batches;
    },
    [[]]
  );
}

/**
 * https://developers.line.biz/en/reference/messaging-api/#send-multicast-message
 * @param {string[]} userIds
 * @param {object[]} messages - Array of line message objects, max size:5
 */
const multicast = async (userIds, messages) => {
  for (const userIdBatch of batch(
    userIds,
    500 /* Multicast can send to 500 ppl in max each time */
  )) {
    await lineClient.post('/message/multicast', {
      to: userIdBatch,
      messages: messages,
    });
  }
};

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
