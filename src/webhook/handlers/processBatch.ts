import { Message } from '@line/bot-sdk';
import { t } from 'ttag';

import { Context, CooccurredMessage } from 'src/types/chatbotState';

import { POSTBACK_NO, POSTBACK_YES, createPostbackAction } from './utils';

async function processBatch(messages: CooccurredMessage[]) {
  const context: Context = {
    sessionId: Date.now(),
    msgs: [],
  };

  const messageTypeStr = messages.map((msg) => {
    const type = msg.type;
    switch (type) {
      case 'text':
        return t`texts`;
      case 'video':
        return t`videos`;
      case 'audio':
        return t`audios`;
      case 'image':
        return t`images`;
      default:
        // exhaustive check
        return type satisfies never;
    }
  });

  const replies: Message[] = [
    {
      type: 'text',
      text: t`May I ask if these ${messageTypeStr} were sent by the same person at the same time?`,
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
