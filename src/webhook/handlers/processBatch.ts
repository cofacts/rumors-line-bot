import { Context, CooccurredMessage } from 'src/types/chatbotState';
import { createTextMessage } from './utils';
import { Message } from '@line/bot-sdk';

async function processBatch(messages: CooccurredMessage[]) {
  const context: Context = {
    sessionId: Date.now(),
    msgs: [],
  };

  const replies: Message[] = [
    createTextMessage({
      text: `目前我還沒辦法一次處理 ${messages.length} 則訊息，請一則一則傳進來唷！`,
    }),
  ];

  return {
    context: {
      data: context,
    },
    replies,
  };
}

export default processBatch;
