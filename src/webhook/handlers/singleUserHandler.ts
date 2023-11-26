import { t } from 'ttag';
import { Request } from 'koa';
import { WebhookEvent } from '@line/bot-sdk';

import { PostbackActionData } from 'src/types/chatbotState';
import ga from 'src/lib/ga';
import redis from 'src/lib/redisClient';
import { extractArticleId } from 'src/lib/sharedUtils';
import lineClient from 'src/webhook/lineClient';
import UserSettings from 'src/database/models/userSettings';
import { Result } from 'src/types/result';

import handlePostback from './handlePostback';
import {
  TUTORIAL_STEPS,
  createGreetingMessage,
  createTutorialMessage,
} from './tutorial';
import processMedia from './processMedia';
import initState from './initState';

const userIdBlacklist = (process.env.USERID_BLACKLIST || '').split(',');

// Set 58s timeout.
// Reply tokens must be used within one minute after receiving the webhook.
// Ref: https://developers.line.biz/en/reference/messaging-api/#send-reply-message
//
const REPLY_TIMEOUT = 58000;

const singleUserHandler = async (
  req: Request,
  replyToken: string,
  userId: string,
  webhookEvent: WebhookEvent
) => {
  if (userIdBlacklist.indexOf(userId) !== -1) {
    // User blacklist
    console.log(
      `[LOG] Blocked user INPUT =\n${JSON.stringify({
        userId,
        ...webhookEvent,
      })}\n`
    );
    return;
  }

  let isRepliedDueToTimeout = false;

  // Tell the user the bot is busy if processing does not end within timeout
  //
  const timerId = setTimeout(function () {
    isRepliedDueToTimeout = true;
    console.log(
      `[LOG] Timeout ${JSON.stringify({
        userId,
        ...webhookEvent,
      })}\n`
    );
    lineClient.post('/message/reply', {
      replyToken,
      messages: [
        {
          type: 'text',
          text: t`Line bot is busy, or we cannot handle this message. Maybe you can try again a few minutes later.`,
        },
      ],
    });
  }, REPLY_TIMEOUT);

  // Get user's context from redis or create a new one
  //
  const context = (await redis.get(userId)) || {
    data: { sessionId: Date.now() },
  };

  // A helper function in singleUserHandler that indicates the end of processing
  // and send back the result to user as replies.
  //
  async function send(result: Result) {
    clearTimeout(timerId);

    if (isRepliedDueToTimeout) {
      console.log('[LOG] reply & context setup aborted');
      return;
    }

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
    lineClient.post('/message/reply', {
      replyToken,
      messages: result.replies,
    });

    // Set context
    //
    await redis.set(userId, result.context);
  }

  switch (webhookEvent.type) {
    default: {
      // These events are not handled at all.
      clearTimeout(timerId);
      return;
    }

    case 'unfollow': {
      await UserSettings.setAllowNewReplyUpdate(userId, false);
      clearTimeout(timerId);
      return;
    }

    case 'follow': {
      await UserSettings.setAllowNewReplyUpdate(userId, true);

      // Create new context
      const data = { sessionId: Date.now() };

      const visitor = ga(userId, 'TUTORIAL');
      visitor.event({
        ec: 'Tutorial',
        ea: 'Step',
        el: 'ON_BOARDING',
      });
      visitor.send();

      return send({
        context: { data },
        replies: [
          createGreetingMessage(),
          createTutorialMessage(data.sessionId),
        ],
      });
    }

    case 'postback': {
      const postbackData = JSON.parse(
        webhookEvent.postback.data
      ) as PostbackActionData<unknown>;

      if (postbackData.sessionId === context.data.sessionId) {
        return send(await handlePostback(context.data, postbackData, userId));
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
      clearTimeout(timerId);
      return;
    }

    case 'audio':
    case 'video':
    case 'image':
      // TODO: replace this with pushing message into context
      return send(await processMedia(webhookEvent, userId));

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
      clearTimeout(timerId);
      return;
    }

    case TUTORIAL_STEPS['RICH_MENU']: {
      // Start new session, reroute to TUTORIAL
      const sessionId = Date.now();
      return send(
        await handlePostback(
          { sessionId, searchedText: '' },
          {
            state: 'TUTORIAL',
            sessionId,
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
        const sessionId = Date.now();
        return send(
          await handlePostback(
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
          )
        );
      }

      // The user forwarded us an new message.
      // TODO: replace this with pushing message into context
      //
      const result = await initState({
        data: {
          // Create a new "search session".
          // Used to determine button postbacks and GraphQL requests are from
          // previous sessions
          //
          sessionId: Date.now(),

          // Store user input into context
          searchedText: trimmedInput,
        },
        userId,
      });

      return send({
        context: { data: result.data },
        replies: result.replies,
      });
    }
  }
};

export default singleUserHandler;
