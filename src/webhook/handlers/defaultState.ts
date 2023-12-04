import { Message } from '@line/bot-sdk';
import { ChatbotPostbackHandlerParams, Result } from 'src/types/chatbotState';

export default function defaultState(
  params: ChatbotPostbackHandlerParams
): Result {
  const replies: Message[] = [
    {
      type: 'text',
      text: '我們看不懂 QQ\n大俠請重新來過。',
    },
  ];
  return { ...params, replies };
}
