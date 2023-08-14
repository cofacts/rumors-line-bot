import type { Message, MessageEvent, WebhookEvent } from '@line/bot-sdk';

export type ChatbotState =
  | '__INIT__'
  | 'TUTORIAL'
  | 'CHOOSING_ARTICLE'
  | 'CHOOSING_REPLY'
  | 'ASKING_ARTICLE_SOURCE'
  | 'ASKING_ARTICLE_SUBMISSION_CONSENT';

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
  event: (WebhookEvent | ServerChooseEvent) & ArgumentedEventParams;
  userId: string;
  replies: Message[];
};

type ChatbotStateHandlerReturnType = Omit<
  ChatbotStateHandlerParams,
  /** The state is determined by payloads in actions. No need to return state. */ 'state'
>;

/**
 *
 */
export type ChatbotStateHandler = (
  params: ChatbotStateHandlerParams
) => Promise<ChatbotStateHandlerReturnType>;
