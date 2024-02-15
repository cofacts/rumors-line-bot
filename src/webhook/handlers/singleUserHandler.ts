import { t } from 'ttag';
import { WebhookEvent } from '@line/bot-sdk';

import {
  CooccurredMessage,
  PostbackActionData,
  Result,
  LegacyContext,
  Context,
} from 'src/types/chatbotState';
import ga from 'src/lib/ga';
import redis from 'src/lib/redisClient';
import { extractArticleId, sleep } from 'src/lib/sharedUtils';
import lineClient from 'src/webhook/lineClient';
import UserSettings from 'src/database/models/userSettings';

import handlePostback from './handlePostback';
import {
  TUTORIAL_STEPS,
  createGreetingMessage,
  createTutorialMessage,
} from './tutorial';
import processMedia from './processMedia';
import processBatch from './processBatch';
import initState from './initState';

const userIdBlacklist = (process.env.USERID_BLACKLIST || '').split(',');

// Set 58s timeout.
// Reply tokens must be used within one minute after receiving the webhook.
// Ref: https://developers.line.biz/en/reference/messaging-api/#send-reply-message
//
const REPLY_TIMEOUT = 58000;

/**
 * The amount of time to wait for the next message to arrive before processing the batch.
 */
const TIMEOUT_BEFORE_PROCESSING = 500; // ms

/**
 * The amount of time to wait for the next message to arrive before asking if the messages are
 * sent by the same person at the same time.
 */
const TIMEOUT_BEFORE_ASKING_COOCCURRENCES = 1000; // ms

// A symbol that is used to prevent accidental return in singleUserHandler.
// It should only be used when timeout are correctly handled.
//
const PROCESSED = Symbol('Processed in singleUserHandler');

const singleUserHandler = async (
  userId: string,
  webhookEvent: WebhookEvent
): Promise<typeof PROCESSED> => {
  if (userIdBlacklist.indexOf(userId) !== -1) {
    // User blacklist
    console.log(
      `[LOG] Blocked user INPUT =\n${JSON.stringify({
        userId,
        ...webhookEvent,
      })}\n`
    );
    return PROCESSED;
  }

  let isRepliedDueToTimeout = false;

  // Tell the user the bot is busy if processing does not end within timeout
  //
  const timerId = setTimeout(async function () {
    console.log(
      `[LOG] Timeout ${JSON.stringify({
        userId,
        ...webhookEvent,
      })}\n`
    );
    await send({
      context,
      replies: [
        {
          type: 'text',
          text: t`Line bot is busy, or we cannot handle this message. Maybe you can try again a few minutes later.`,
        },
      ],
    });

    isRepliedDueToTimeout = true;
  }, REPLY_TIMEOUT);

  const context = await getContextForUser(userId);
  const REDIS_BATCH_KEY = getRedisBatchKey(userId);

  /**
   * @param msg
   * @returns if the specified CooccurredMsg is the last one in the current batch of CooccurredMsgs.
   */
  async function isLastInBatch(msg: CooccurredMessage) {
    const lastMsgInBatch: CooccurredMessage | undefined = (
      await redis.range(REDIS_BATCH_KEY, -1, -1)
    )[0];
    return !!lastMsgInBatch && msg.id === lastMsgInBatch.id;
  }

  // Helper functions in singleUserHandler that indicates the end of processing.
  // If `forMsg` is provided, also check if the message is the latest in batch.
  //
  async function send(
    result: Result,

    /**
     * The msg that this result is for.
     * If provided, exercise extra check ensure `result` is up-to-date before sending replies.
     * */
    forMsg?: CooccurredMessage
  ): Promise<typeof PROCESSED> {
    if (isRepliedDueToTimeout) {
      console.log('[LOG] reply & context setup aborted');
      return cancel();
    }

    // Check forMsg only when it is provided
    if (forMsg !== undefined && !(await isLastInBatch(forMsg))) {
      // The batch has new messages inside, thus the result is outdated and should be abandoned.
      // Leave the rest to the processor of the last msg in batch.
      //
      return cancel();
    }

    // We are sending reply, stop timer countdown
    clearTimeout(timerId);

    // The chatbot's reply cuts off the user's input streak, thus we end the current batch here.
    redis.del(REDIS_BATCH_KEY);

    console.log(
      JSON.stringify({
        CONTEXT: result.context,
        INPUT: { userId, ...webhookEvent },
        OUTPUT: result,
      })
    );

    // Send replies. Does not need to wait for lineClient's callbacks.
    // lineClient's callback does error handling by itself.
    //
    if ('replyToken' in webhookEvent) {
      lineClient.post('/message/reply', {
        replyToken: webhookEvent.replyToken,
        messages: result.replies,
      });
    }

    // Set context
    //
    await redis.set(userId, result.context);
    return PROCESSED;
  }

  // Does not reply and just exit processing.
  //
  function cancel(): typeof PROCESSED {
    clearTimeout(timerId); // Avoid timeout after we exit
    return PROCESSED;
  }

  /**
   * Adds cooccurred message to batch.
   * After BATCH_TIMEOUT since the last message has been added, initiate the processing of these
   * co-occurred messages.
   */
  async function addMsgToBatch(
    msg: CooccurredMessage
  ): Promise<typeof PROCESSED> {
    await redis.push(REDIS_BATCH_KEY, msg);

    await sleep(TIMEOUT_BEFORE_PROCESSING);

    if (!(await isLastInBatch(msg))) {
      // New message appears during we sleep,
      // abort processing and let the new message's callback do the work.
      return cancel();
    }

    // Try processing the batch and calculate results
    //
    const messages: CooccurredMessage[] = await redis.range(
      REDIS_BATCH_KEY,
      0,
      -1
    );

    if (messages.length !== 1) {
      // Asking cooccurrences are faster than processing single message in batch.
      // To prevent new messages from coming in right after we ask cooccurrences,
      // we wait first and check if there are new messages.
      //
      await sleep(TIMEOUT_BEFORE_ASKING_COOCCURRENCES);
      return send(await processBatch(messages, userId), msg);
    }

    // Now there is only one message in the batch;
    // messages[0] should be identical to msg.
    //
    if (msg.type !== 'text') {
      return send(await processMedia(msg, userId), msg);
    }

    return send(
      await initState({
        // Create a new "search session".
        // Used to determine button postbacks and GraphQL requests are from
        // previous sessions
        //
        context: {
          ...getNewContext(),
          msgs: [msg],
        },
        userId,
      }),
      msg
    );
  }

  switch (webhookEvent.type) {
    default: {
      // These events are not handled at all.
      return cancel();
    }

    case 'unfollow': {
      await UserSettings.setAllowNewReplyUpdate(userId, false);
      return cancel();
    }

    case 'follow': {
      await UserSettings.setAllowNewReplyUpdate(userId, true);

      // Create new context
      const context = getNewContext();

      const visitor = ga(userId, 'TUTORIAL');
      visitor.event({
        ec: 'Tutorial',
        ea: 'Step',
        el: 'ON_BOARDING',
      });
      visitor.send();

      return send({
        context,
        replies: [
          createGreetingMessage(),
          createTutorialMessage(context.sessionId),
        ],
      });
    }

    case 'postback': {
      const postbackData = JSON.parse(
        webhookEvent.postback.data
      ) as PostbackActionData<unknown>;

      if (postbackData.sessionId === context.sessionId) {
        return send(await handlePostback(context, postbackData, userId));
      }

      // Postback data session ID != context session ID can happen when
      // (1) user context in redis is expired, or
      // (2) if other new messages have been sent before pressing buttons.
      //
      // Under these scenarios, tell the user about the expiry of buttons
      //
      console.log('Previous button pressed.');

      clearTimeout(timerId);
      return send({
        context, // Reuse existing context
        replies: [
          {
            type: 'text',
            text:
              '🚧 ' +
              t`You are currently searching for another message, buttons from previous search sessions do not work now.`,
          },
        ],
      });
    }

    case 'message': {
      break; // Handle message events later
    }
  }

  // We have message events left.
  //
  switch (webhookEvent.message.type) {
    default: {
      // Track other message type send by user
      ga(userId)
        .event({
          ec: 'UserInput',
          ea: 'MessageType',
          el: webhookEvent.message.type,
        })
        .send();
      return cancel();
    }

    case 'audio':
    case 'video':
    case 'image':
      return addMsgToBatch({
        type: webhookEvent.message.type,
        id: webhookEvent.message.id,
      });

    case 'text': {
      // Handle text events later
      break;
    }
  }

  // Handle text event messages
  //
  switch (webhookEvent.message.text) {
    // Debugging: type 'RESET' to reset user's context and start all over.
    //
    case 'RESET': {
      redis.del(userId);
      redis.del(REDIS_BATCH_KEY);
      return cancel();
    }

    case TUTORIAL_STEPS['RICH_MENU']: {
      // Start new session, reroute to TUTORIAL
      const context = getNewContext();
      return send(
        await handlePostback(
          context,
          {
            state: 'TUTORIAL',
            sessionId: context.sessionId,
            input: TUTORIAL_STEPS['RICH_MENU'],
          },
          userId
        )
      );
    }

    default: {
      const trimmedInput = webhookEvent.message.text.trim();
      const articleId = extractArticleId(trimmedInput);

      if (articleId) {
        // It is a predefined text message wanting us to visit a article.
        // Start new session, reroute to CHOOSING_ARTILCE and simulate "choose article" postback event
        const context = getNewContext();
        return send(
          await handlePostback(
            // Start a new session
            context,
            {
              state: 'CHOOSING_ARTICLE',
              sessionId: context.sessionId,
              input: articleId,
            },
            userId
          )
        );
      }

      // The user forwarded us an new message.
      //
      return addMsgToBatch({
        id: webhookEvent.message.id,
        type: 'text',
        text: trimmedInput,
      });
    }
  }
};

export function getRedisBatchKey(userId: string) {
  return `${userId}:batch`;
}

function getNewContext(): Context {
  return {
    sessionId: Date.now(),
    msgs: [],
  };
}

/**
 * Get user's context from redis or create a new one.
 * Automatically convert legacy context to new context.
 *
 * @param userId
 * @returns user's context from Redis, or newly created context
 */
async function getContextForUser(userId: string): Promise<Context> {
  const context = ((await redis.get(userId)) || getNewContext()) as
    | LegacyContext
    | Context;

  if (!('data' in context)) {
    // New context
    return context;
  }

  // Converting legacy context to new context
  return {
    sessionId: context.data.sessionId,
    msgs: [
      'searchedText' in context.data
        ? {
            id: context.data.sessionId.toString(), // Original message ID is not available, use session id to differentiate
            type: 'text',
            text: context.data.searchedText,
          }
        : {
            id: context.data.messageId,
            type: context.data.messageType,
          },
    ],
  };
}

export default singleUserHandler;
