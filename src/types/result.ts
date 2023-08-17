import { Message } from '@line/bot-sdk';
import { Context } from './chatbotState';

export declare type Result = {
  context: {
    data: Partial<Context>;
  };
  replies: Message[];
};
