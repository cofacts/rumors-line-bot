import { TimeoutError, isEventExpired } from './utils';
import ga from 'src/lib/ga';
import rollbar from 'src/lib/rollbar';
import lineClient from 'src/webhook/lineClient';
import groupMessage from './groupMessage';

export default async function processGroupEvent({
  type,
  replyToken,
  groupId,
  webhookEvent,
}) {
  // await new Promise(resolve => setTimeout(resolve, 2000));

  // Set default result
  //
  let result = {
    context: { data: {} },
    replies: undefined,
  };

  // Handle join/leave event
  // To calculate total group the bot joined, we set ga event value 1 as join, -1 as leave
  // Details see Implicit Count in https://support.google.com/analytics/answer/1033068?hl=en
  if (type === 'join') {
    // https://developers.line.biz/en/reference/messaging-api/#get-members-group-count
    // Note: leave group cannot get the number
    const { count: groupMembersCount } = await lineClient.get(
      `/${webhookEvent.source.type}/${groupId}/members/count`
    );

    const visitor = ga(groupId, 'N/A', '', webhookEvent.source.type);
    visitor.set('cm1', groupMembersCount);
    visitor.event({
      ec: 'Group',
      ea: 'Join',
      ev: 1,
    });
    visitor.send();
  } else if (type === 'leave') {
    const visitor = ga(groupId, 'N/A', '', webhookEvent.source.type);
    visitor.event({
      ec: 'Group',
      ea: 'Leave',
      ev: -1,
    });
    visitor.send();
  }

  // React to certain type of events
  //
  if (type === 'message' && webhookEvent.message.type === 'text') {
    const input = webhookEvent.message.text;

    try {
      result = await groupMessage({ type, input, ...webhookEvent }, groupId);
    } catch (e) {
      console.error(e);
      rollbar.error(e, { type, input, ...webhookEvent });
    }
  }
  // else if (type === 'message' && webhookEvent.message.type === 'image') {
  //   // skip
  // } else if (type === 'message' && webhookEvent.message.type === 'video') {
  //   // skip
  // }
  if (isEventExpired(webhookEvent.timestamp)) {
    return Promise.reject(new TimeoutError('Event expired'));
  }

  return Promise.resolve({ result, replyToken });
}
