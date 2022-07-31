import { t } from 'ttag';
import Router from 'koa-router';
import rollbar from 'src/lib/rollbar';

import redis from 'src/lib/redisClient';
import lineClient from './lineClient';
import checkSignatureAndParse from './checkSignatureAndParse';
import handleInput from './handleInput';
import handlePostback from './handlePostback';
import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';
import GroupHandler from './handlers/groupHandler';
import processImage from './handlers/processImage';
import ga from 'src/lib/ga';

import UserSettings from '../database/models/userSettings';
import {
  createGreetingMessage,
  createTutorialMessage,
} from './handlers/tutorial';

const userIdBlacklist = (process.env.USERID_BLACKLIST || '').split(',');

const singleUserHandler = async (
  req,
  type,
  replyToken,
  timeout,
  userId,
  otherFields
) => {
  // reply before timeout
  // the reply token becomes invalid after a certain period of time
  // https://developers.line.biz/en/reference/messaging-api/#send-reply-message
  let isReplied = false;
  const messageBotIsBusy = [
    {
      type: 'text',
      text: t`Line bot is busy, or we cannot handle this message. Maybe you can try again a few minutes later.`,
    },
  ];
  const timerId = setTimeout(function() {
    isReplied = true;
    console.log(
      `[LOG] Timeout ${JSON.stringify({
        type,
        userId,
        ...otherFields,
      })}\n`
    );
    lineClient.post('/message/reply', {
      replyToken,
      messages: messageBotIsBusy,
    });
  }, timeout);

  if (userIdBlacklist.indexOf(userId) !== -1) {
    // User blacklist
    console.log(
      `[LOG] Blocked user INPUT =\n${JSON.stringify({
        type,
        userId,
        ...otherFields,
      })}\n`
    );
    clearTimeout(timerId);
    return;
  }

  // Set default result
  //
  let result = {
    context: { data: {} },
    replies: [
      {
        type: 'text',
        text: t`I cannot understand messages other than text.`,
      },
    ],
  };

  // Handle follow/unfollow event
  if (type === 'follow') {
    await UserSettings.setAllowNewReplyUpdate(userId, true);

    if (process.env.RUMORS_LINE_BOT_URL) {
      const data = { sessionId: Date.now() };
      result = {
        context: { data: data },
        replies: [
          createGreetingMessage(),
          createTutorialMessage(data.sessionId),
        ],
      };

      const visitor = ga(userId, 'TUTORIAL');
      visitor.event({
        ec: 'Tutorial',
        ea: 'Step',
        el: 'ON_BOARDING',
      });
      visitor.send();
    } else {
      clearTimeout(timerId);
      return;
    }
  } else if (type === 'unfollow') {
    await UserSettings.setAllowNewReplyUpdate(userId, false);
    clearTimeout(timerId);
    return;
  }

  const context = (await redis.get(userId)) || {};
  // React to certain type of events
  //
  if (type === 'message' && otherFields.message.type === 'text') {
    // normalized "input"
    const input = otherFields.message.text;

    // Debugging: type 'RESET' to reset user's context and start all over.
    //
    if (input === 'RESET') {
      redis.del(userId);
      clearTimeout(timerId);
      return;
    }

    result = await processText(context, type, input, otherFields, userId, req);
  } else if (type === 'message' && otherFields.message.type === 'image') {
    const event = { messageId: otherFields.message.id, type, ...otherFields };

    result = await processImage(context, event, userId);
  } else if (type === 'message' && otherFields.message.type === 'video') {
    // Track video message type send by user
    ga(userId)
      .event({
        ec: 'UserInput',
        ea: 'MessageType',
        el: otherFields.message.type,
      })
      .send();

    //uploadVideoFile(otherFields.message.id);
  } else if (type === 'message') {
    // Track other message type send by user
    ga(userId)
      .event({
        ec: 'UserInput',
        ea: 'MessageType',
        el: otherFields.message.type,
      })
      .send();
  } else if (type === 'postback') {
    let input;

    const postbackData = JSON.parse(otherFields.postback.data);

    // Handle the case when user context in redis is expired
    if (!context.data) {
      lineClient.post('/message/reply', {
        replyToken,
        messages: [
          {
            type: 'text',
            text: '🚧 ' + t`Sorry, the button is expired.`,
          },
        ],
      });
      clearTimeout(timerId);
      return;
    }

    // When the postback is expired,
    // i.e. If other new messages have been sent before pressing buttons,
    // Don't do anything, just ignore silently.
    //
    if (postbackData.sessionId !== context.data.sessionId) {
      console.log('Previous button pressed.');
      lineClient.post('/message/reply', {
        replyToken,
        messages: [
          {
            type: 'text',
            text:
              '🚧 ' +
              t`You are currently searching for another message, buttons from previous search sessions do not work now.`,
          },
        ],
      });
      clearTimeout(timerId);
      return;
    }

    input = postbackData.input;

    result = await handlePostback(
      context,
      postbackData.state,
      { type, input, otherFields },
      userId
    );
  }

  if (isReplied) {
    console.log('[LOG] reply & context setup aborted');
    return;
  }
  clearTimeout(timerId);

  // LOGGING:
  // 60 chars per line, each prepended with ||LOG||
  //
  console.log('\n||LOG||<----------');
  JSON.stringify({
    CONTEXT: context,
    INPUT: { type, userId, ...otherFields },
    OUTPUT: result,
  })
    .split(/(.{60})/)
    .forEach(line => {
      if (line) {
        // Leading \n makes sure ||LOG|| is in the first line
        console.log(`\n||LOG||${line}`);
      }
    });
  console.log('\n||LOG||---------->');

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
};

async function processText(context, type, input, otherFields, userId, req) {
  let result;
  try {
    result = await handleInput(
      context,
      { type, input, ...otherFields },
      userId
    );
    if (!result.replies) {
      throw new Error(
        'Returned replies is empty, please check processMessages() implementation.'
      );
    }
  } catch (e) {
    console.error(e);
    rollbar.error(e, req);
    result = {
      context: { data: {} },
      replies: [
        {
          type: 'text',
          text: t`Oops, something is not working. We have cleared your search data, hopefully the error will go away. Would you please send us the message from the start?`,
        },
      ],
    };
  }
  return result;
}

const router = Router();

const groupHandler = new GroupHandler(groupEventQueue, expiredGroupEventQueue);
// Routes that is after protection of checkSignature
//
router.use('/', checkSignatureAndParse);
router.post('/', ctx => {
  // Allow free-form request handling.
  // Don't wait for anything before returning 200.

  ctx.request.body.events.forEach(
    async ({ type, replyToken, ...otherFields }) => {
      // set 28s timeout
      const timeout = 28000;
      if (otherFields.source.type === 'user') {
        singleUserHandler(
          ctx.request,
          type,
          replyToken,
          timeout,
          otherFields.source.userId,
          otherFields
        );
      } else if (
        otherFields.source.type === 'group' ||
        otherFields.source.type === 'room'
      ) {
        groupHandler.addJob({
          type,
          replyToken,
          groupId: otherFields.source.groupId || otherFields.source.roomId,
          otherFields,
        });
      }
    }
  );
  ctx.status = 200;
});

export default router;
