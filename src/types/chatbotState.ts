import type { Message, MessageEvent, PostbackEvent } from '@line/bot-sdk';

export type ChatbotState =
  | '__INIT__'
  | 'TUTORIAL'
  | 'CHOOSING_ARTICLE'
  | 'CHOOSING_REPLY'
  | 'ASKING_ARTICLE_SOURCE'
  | 'ASKING_ARTICLE_SUBMISSION_CONSENT'
  | 'Error';

/**
 * Dummy event, used exclusively when calling handler from another handler
 */
type ServerChooseEvent = {
  type: 'server_choose';
};

/**
 * Parameters that are added by handleInput.
 *
 * @todo: We should consider using value from authentic event instead of manually adding fields.
 */
type ArgumentedEventParams = {
  /**
   * The text in text message, or value from payload in actions.
   */
  input: string;
};

export type ChatbotEvent =
  | ((MessageEvent | ServerChooseEvent) & ArgumentedEventParams)
  | PostbackEvent;

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

export type ChatbotStateHandlerParams = {
  /** Record<string, never> is for empty object and it's the default parameter in handleInput and handlePostback */
  data: Context | Record<string, never>;
  state: ChatbotState;
  event: ChatbotEvent;
  userId: string;
  replies: Message[];
};

export type ChatbotStateHandlerReturnType = Pick<
  ChatbotStateHandlerParams,
  'data' | 'replies'
>;

/**
 * Generic handler type for function under src/webhook/handlers
 */
export type ChatbotStateHandler = (
  params: ChatbotStateHandlerParams
) => Promise<ChatbotStateHandlerReturnType>;

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
