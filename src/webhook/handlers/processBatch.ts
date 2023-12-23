import { Message } from '@line/bot-sdk';

import { Context, CooccurredMessage } from 'src/types/chatbotState';
import { sleep } from 'src/lib/sharedUtils';

import { createTextMessage } from './utils';

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

  // TODO: initiate multi-message processing here
  //
  await sleep(1000); // Simulate multi-message processing and see if more message in batch.

  return { context, replies };
}

export default processBatch;
