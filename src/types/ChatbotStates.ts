import type { Message, MessageEvent, WebhookEvent } from '@line/bot-sdk';

export type ChatbotState =
  | '__INIT__'
  | 'TUTORIAL'
  | 'CHOOSING_ARTICLE'
  | 'CHOOSING_REPLY'
  | 'ASKING_ARTICLE_SOURCE'
  | 'ASKING_ARTICLE_SUBMISSION_CONSENT';

export type ChatbotStateHandlerParams = {
  data: {
    /** Used to differientiate different search sessions (searched text or media) */
    sessionId: number;

    /** Searched text that started this search session */
    searchedText?: string;

    /** Searched multi-media message that started this search session */
    messageId: MessageEvent['message']['id'];
    messageType: MessageEvent['message']['type'];

    /** User selected article in DB */
    selectedArticleId?: string;
    selectedArticleText?: string;
  };
  state: ChatbotState;
  event: WebhookEvent;
  userId: string;
  replies: Message[];
};

/**
 *
 */
export type ChatbotStateHandler = (
  params: ChatbotStateHandlerParams
) => Promise<ChatbotStateHandlerParams>;
