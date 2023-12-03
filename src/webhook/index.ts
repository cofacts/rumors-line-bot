import Router from 'koa-router';

import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';

import checkSignatureAndParse from './checkSignatureAndParse';
import singleUserHandler from './handlers/singleUserHandler';
import GroupHandler from './handlers/groupHandler';
import { WebhookEvent } from '@line/bot-sdk';

const router = new Router();

const groupHandler = new GroupHandler(groupEventQueue, expiredGroupEventQueue);
// Routes that is after protection of checkSignature
//
router.use('/', checkSignatureAndParse);
router.post('/', (ctx) => {
  // Allow free-form request handling.
  // Don't wait for anything before returning 200.

  (ctx.request.body as { events: WebhookEvent[] }).events.forEach(
    async (webhookEvent: WebhookEvent) => {
      if (webhookEvent.source.type === 'user') {
        singleUserHandler(webhookEvent.source.userId, webhookEvent);
      } else if (
        webhookEvent.source.type === 'group' ||
        webhookEvent.source.type === 'room'
      ) {
        const groupId =
          webhookEvent.source.type === 'group'
            ? webhookEvent.source.groupId
            : webhookEvent.source.roomId;

        groupHandler.addJob({
          type: webhookEvent.type,
          replyToken:
            'replyToken' in webhookEvent ? webhookEvent.replyToken : '',
          groupId,
          webhookEvent,
        });
      }
    }
  );
  ctx.status = 200;
});

export default router;
