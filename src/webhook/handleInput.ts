import initState from './handlers/initState';
import defaultState from './handlers/defaultState';
import { extractArticleId } from 'src/lib/sharedUtils';
import { TUTORIAL_STEPS } from './handlers/tutorial';
import handlePostback from './handlePostback';
import {
  ChatbotState,
  ChatbotStateHandlerParams,
  ChatbotStateHandlerReturnType,
} from 'src/types/chatbotState';
import { Result } from 'src/types/result';
import { Message, MessageEvent, TextEventMessage } from '@line/bot-sdk';

/**
 * Given input event and context, outputs the new context and the reply to emit.
 *
 * @param context The current context of the bot
 * @param event The input event
 * @param userId LINE user ID that does the input
 */
export default async function handleInput(
  { data = {} },
  event: MessageEvent & { message: TextEventMessage },
  userId: string
): Promise<Result> {
  let state: ChatbotState;
  const replies: Message[] = [];

  // Trim input because these may come from other chatbot
  //
  const trimmedInput = event.message.text.trim();
  const articleId = extractArticleId(trimmedInput);
  if (articleId) {
    // Start new session, reroute to CHOOSING_ARTILCE and simulate "choose article" postback event
    const sessionId = Date.now();
    return await handlePostback(
      // Start a new session
      {
        sessionId,
        searchedText: '',
      },
      {
        state: 'CHOOSING_ARTICLE',
        sessionId,
        input: articleId,
      },
      userId
    );
  } else if (event.message.text === TUTORIAL_STEPS['RICH_MENU']) {
    // Start new session, reroute to TUTORIAL
    const sessionId = Date.now();
    return await handlePostback(
      { sessionId, searchedText: '' },
      {
        state: 'TUTORIAL',
        sessionId,
        input: TUTORIAL_STEPS['RICH_MENU'],
      },
      userId
    );
  } else {
    // The user forwarded us an new message.
    // Create a new "search session".
    //
    data = {
      // Used to determine button postbacks and GraphQL requests are from
      // previous sessions
      //
      sessionId: Date.now(),
    };
    state = '__INIT__';
  }

  const params: ChatbotStateHandlerParams = {
    data,
    state,
    event: {
      ...event,
      message: event.message,
      input: trimmedInput,
    },
    userId,
    replies,
  };

  let result: ChatbotStateHandlerReturnType;

  // Sets data and replies
  //
  switch (params.state) {
    case '__INIT__': {
      result = await initState(params);
      break;
    }

    default: {
      result = defaultState(params);
      break;
    }
  }

  return {
    context: { data: result.data },
    replies: result.replies,
  };
}
