import type { Message, MessageEvent } from '@line/bot-sdk';

export type ChatbotState =
  | '__INIT__'
  | 'TUTORIAL'
  | 'CHOOSING_ARTICLE'
  | 'CHOOSING_REPLY'
  | 'ASKING_ARTICLE_SOURCE'
  | 'ASKING_ARTICLE_SUBMISSION_CONSENT'
  | 'ASKING_COOCCURRENCE'
  | 'CONTINUE' // quick reply from reply token collection
  | 'Error';

export type LegacyContext = {
  data: {
    /** Used to differientiate different search sessions (searched text or media) */
    sessionId: number;
  } & (
    | {
        /** Searched multi-media message that started this search session */
        messageId: MessageEvent['message']['id'];
        messageType: Extract<
          MessageEvent['message']['type'],
          'audio' | 'video' | 'image'
        >;
      }
    | {
        /** Searched text that started this search session */
        searchedText: string;
      }
  );
};

export type Context = {
  /** Used to differientiate different search sessions (searched text or media) */
  sessionId: number;
  msgs: ReadonlyArray<CooccurredMessage>;

  /** Latest reply token that is not consumed yet */
  replyToken?: {
    token: string;
    // Is this field used anywhere, AI?
    receivedAt: number;
  };
};

/** A single messages in the same co-occurrence */
export type CooccurredMessage = {
  id: MessageEvent['message']['id'];
} & (
  | {
      type: Extract<
        MessageEvent['message']['type'],
        'audio' | 'video' | 'image'
      >;
    }
  | {
      type: Extract<MessageEvent['message']['type'], 'text'>;
      /** Searched text that started this search session */
      text: string;
    }
);

/** Result of handler or processors */
export type Result = {
  /** The new context to set after processing the event */
  context: Context;

  /** The messages to send to the user as reply */
  replies: Message[];
};

/**
 * The data that postback action stores as JSON.
 */
export type PostbackActionData<T> = {
  input: T;
  sessionId: number;
  state: ChatbotState;
};

export type ChatbotPostbackHandlerParams<T = unknown> = {
  /** Chatbot context */
  context: Context;
  /** Data in postback payload */
  postbackData: PostbackActionData<T>;
  userId: string;
};

/**
 * For chatbot postback event handers
 */
export type ChatbotPostbackHandler<T = unknown> = (
  params: ChatbotPostbackHandlerParams<T>
) => Promise<Result>;
