import type { Message, WebhookEvent } from '@line/bot-sdk';

export declare type ChatbotState =
  | '__INIT__'
  | 'TUTORIAL'
  | 'CHOOSING_ARTICLE'
  | 'CHOOSING_REPLY'
  | 'ASKING_ARTICLE_SOURCE'
  | 'ASKING_ARTICLE_SUBMISSION_CONSENT';

export declare type ChatbotStateHandlerParams = {
  data: unknown;
  state: ChatbotState;
  event: WebhookEvent;
  userId: string;
  replies: Message[];
};

/**
 *
 */
export declare type ChatbotStateHandler = (
  params: ChatbotStateHandlerParams
) => Promise<ChatbotStateHandlerParams>;
