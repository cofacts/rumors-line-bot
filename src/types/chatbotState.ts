import type { Message, MessageEvent, WebhookEvent } from '@line/bot-sdk';

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

export type ChatbotEvent = (
  | MessageEvent
  | ServerChooseEvent
  /**
   * A special format of postback that Chatbot actually uses.
   * @FIXME Replace with original PostbackEvent and parse its action to support passing more thing than a string
   */
  | {
      type: 'postback';
      input: string;
    }
) &
  ArgumentedEventParams;

export type Context = {
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

export type ChatbotStateHandlerParams = {
  /** Record<string, never> is for empty object and it's the default parameter in handleInput and handlePostback */
  data: Context | Record<string, never>;
  state: ChatbotState;
  event: ChatbotEvent;
  userId: string;
  replies: Message[];
};

export type ChatbotStateHandlerReturnType = Omit<
  ChatbotStateHandlerParams,
  /** The state is determined by payloads in actions. No need to return state. */ 'state'
>;

/**
 * Generic handler type for function under src/webhook/handlers
 */
export type ChatbotStateHandler = (
  params: ChatbotStateHandlerParams
) => Promise<ChatbotStateHandlerReturnType>;
