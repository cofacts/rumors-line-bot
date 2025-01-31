import { Message } from '@line/bot-sdk';
import { t } from 'ttag';

import { Context, CooccurredMessage } from 'src/types/chatbotState';

import {
  POSTBACK_NO,
  POSTBACK_YES,
  createPostbackAction,
  createTextMessage,
  setNewContext,
} from './utils';
import ga from 'src/lib/ga';

async function processBatch(messages: CooccurredMessage[], userId: string) {
  const context: Context = await setNewContext(userId, { msgs: messages });

  const msgCount = messages.length;

  const visitor = ga(
    userId,
    '__PROCESS_BATCH__',
    `Batch: ${msgCount} messages`
  );

  // Track media message type send by user
  messages.forEach((message) => {
    visitor.event({
      ec: 'UserInput',
      ea: 'MessageType',
      el: message.type,
    });
  });
  visitor.send();

  const replies: Message[] = [
    {
      ...createTextMessage({
        text: t`May I ask if the ${msgCount} messages above were sent by the same person at the same time?`,
      }),
      quickReply: {
        items: [
          {
            type: 'action',
            action: createPostbackAction(
              t`Yes`,
              POSTBACK_YES,
              t`Yes, same person at same time`,
              context.sessionId,
              'ASKING_COOCCURRENCE'
            ),
          },
          {
            type: 'action',
            action: createPostbackAction(
              t`No`,
              POSTBACK_NO,
              t`No, from different person or at different time`,
              context.sessionId,
              'ASKING_COOCCURRENCE'
            ),
          },
        ],
      },
    },
  ];

  return { context, replies };
}

export default processBatch;
