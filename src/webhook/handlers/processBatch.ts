import { Message } from '@line/bot-sdk';
import { t } from 'ttag';

import { Context, CooccurredMessage } from 'src/types/chatbotState';

import {
  POSTBACK_NO,
  POSTBACK_YES,
  createPostbackAction,
  createTextMessage,
} from './utils';

async function processBatch(messages: CooccurredMessage[]) {
  const context: Context = {
    sessionId: Date.now(),
    msgs: messages,
  };

  const msgCount = messages.length;

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
