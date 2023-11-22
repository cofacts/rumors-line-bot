import type { Message, MessageEvent } from '@line/bot-sdk';

export type ChatbotState =
  | '__INIT__'
  | 'TUTORIAL'
  | 'CHOOSING_ARTICLE'
  | 'CHOOSING_REPLY'
  | 'ASKING_ARTICLE_SOURCE'
  | 'ASKING_ARTICLE_SUBMISSION_CONSENT'
  | 'Error';

export type Context = {
  /** Used to differientiate different search sessions (searched text or media) */
  sessionId: number;
  /** User selected article in DB */
  selectedArticleId?: string;
} & (
  | {
      /** Searched multi-media message that started this search session */
      messageId: MessageEvent['message']['id'];
      messageType: MessageEvent['message']['type'];
    }
  | {
      /** Searched text that started this search session */
      searchedText: string;
    }
);

export type ChatbotStateHandlerReturnType = {
  data: Context;
  replies: Message[];
};

/**
 * The data that postback action stores as JSON.
 *
 * @FIXME Replace input: string with something that is more structured
 */
export type PostbackActionData<T> = {
  input: T;
  sessionId: number;
  state: ChatbotState;
};

export type ChatbotPostbackHandlerParams<T = unknown> = {
  /** Data stored in Chatbot context */
  data: Context;
  /** Data in postback payload */
  postbackData: PostbackActionData<T>;
  userId: string;
};

/**
 * For chatbot postback event handers
 */
export type ChatbotPostbackHandler<T = unknown> = (
  params: ChatbotPostbackHandlerParams<T>
) => Promise<ChatbotStateHandlerReturnType>;
