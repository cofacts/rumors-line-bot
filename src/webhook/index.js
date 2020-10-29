import { t } from 'ttag';
import Router from 'koa-router';
import rollbar from 'src/lib/rollbar';

import redis from 'src/lib/redisClient';
import lineClient from './lineClient';
import checkSignatureAndParse from './checkSignatureAndParse';
import handleInput from './handleInput';
import {
  downloadFile,
  uploadImageFile,
  saveImageFile,
  processImage,
} from './handlers/fileHandler';
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
    lineClient('/message/reply', {
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
    const data = { sessionId: Date.now() };
    result = {
      context: { data: data },
      replies: [createGreetingMessage(), createTutorialMessage(data.sessionId)],
    };

    ga(userId, 'TUTORIAL', 'ON_BOARDING').send();

    await UserSettings.setAllowNewReplyUpdate(userId, true);
  } else if (type === 'unfollow') {
    await UserSettings.setAllowNewReplyUpdate(userId, false);
    clearTimeout(timerId);
    return;
  }

  // React to certain type of events
  //
  if (
    (type === 'message' && otherFields.message.type === 'text') ||
    type === 'postback'
  ) {
    const context = (await redis.get(userId)) || {};

    // normalized "input"
    let input;
    if (type === 'postback') {
      const data = JSON.parse(otherFields.postback.data);

      // When the postback is expired,
      // i.e. If other new messages have been sent before pressing buttons,
      // Don't do anything, just ignore silently.
      //
      if (data.sessionId !== context.data.sessionId) {
        console.log('Previous button pressed.');
        lineClient('/message/reply', {
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

      input = data.input;

      // Pass to handleInput
      // FIXME:
      // handleIput(), processText() arguments is pretty messy here. Should refactor when applying
      // Typescript.
      //
      otherFields.postbackHandlerState = data.state;
    } else if (type === 'message') {
      input = otherFields.message.text;
    }

    // Debugging: type 'RESET' to reset user's context and start all over.
    //
    if (input === 'RESET') {
      redis.del(userId);
      clearTimeout(timerId);
      return;
    }

    result = await processText(context, type, input, otherFields, userId, req);
  } else if (type === 'message' && otherFields.message.type === 'image') {
    if (
      process.env.IMAGE_MESSAGE_ENABLED === 'true' ||
      process.env.IMAGE_MESSAGE_ENABLED === 'TRUE'
    ) {
      const context = (await redis.get(userId)) || {};

      // Limit the number of images that can be processed simultaneously.
      // To avoid race condiction,
      // use `incr` to increase and read 'imageProcessingCount'(one step)
      // instead of using `get` then check to `incr` or do noting(two step).
      const imageProcessingCount = await redis.incr('imageProcessingCount');
      if (imageProcessingCount > (process.env.MAX_IMAGE_PROCESS_NUMBER || 3)) {
        console.log('[LOG] request abort, too many images are processing now.');
        lineClient('/message/reply', {
          replyToken,
          messages: messageBotIsBusy,
        });
        clearTimeout(timerId);
        await redis.decr('imageProcessingCount');
        return;
      }

      let text = '';
      try {
        const res = await downloadFile(otherFields.message.id);
        uploadImageFile(res.clone(), otherFields.message.id);
        await saveImageFile(res, otherFields.message.id);
        text = await processImage(otherFields.message.id);
      } catch (e) {
        console.error(e);
        rollbar.error(e);
      } finally {
        await redis.decr('imageProcessingCount');
      }
      if (text.length >= 3) {
        result = await processText(
          context,
          type,
          text,
          otherFields,
          userId,
          req
        );
      }
    }
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
  }

  if (isReplied) {
    console.log('[LOG] reply & context setup aborted');
    return;
  }
  clearTimeout(timerId);

  // Send replies. Does not need to wait for lineClient's callbacks.
  // lineClient's callback does error handling by itself.
  //
  lineClient('/message/reply', {
    replyToken,
    messages: result.replies,
  });

  // Set context
  //
  await redis.set(userId, result.context);
};

// eslint-disable-next-line
const groupHandler = async (req, type, replyToken, userId, otherFields) => {
  // TODO
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
  return result;
}

// If shutdown during imageProcessing, count will be non-zero value on next deploy.
// So reset imageProcessingCount to 0 every time.
redis.set('imageProcessingCount', 0);

const router = Router();

// Routes that is after protection of checkSignature
//
router.use('/', checkSignatureAndParse);
router.post('/', ctx => {
  // Allow free-form request handling.
  // Don't wait for anything before returning 200.

  ctx.request.body.events.forEach(
    async ({ type, replyToken, source, ...otherFields }) => {
      // set 28s timeout
      const timeout = 28000;
      let { userId } = source;
      if (source.type === 'user') {
        singleUserHandler(
          ctx.request,
          type,
          replyToken,
          timeout,
          userId,
          otherFields
        );
      } else if (source.type === 'group') {
        groupHandler(ctx.request, type, replyToken, userId, otherFields);
      }
    }
  );
  ctx.status = 200;
});

export default router;
