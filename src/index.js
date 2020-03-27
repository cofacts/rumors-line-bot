import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';
import { t } from 'ttag';

import rollbar from './rollbar';
import { version } from '../package.json';

import redis from './redisClient';
import checkSignatureAndParse from './checkSignatureAndParse';
import lineClient from './lineClient';
import handleInput from './handleInput';
import {
  downloadFile,
  uploadImageFile,
  saveImageFile,
  processImage,
} from './handlers/fileHandler';
import ga from './ga';

const app = new Koa();
const router = Router();
const userIdBlacklist = (process.env.USERID_BLACKLIST || '').split(',');

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    rollbar.error(err, ctx.request);
    throw err;
  }
});

router.get('/', ctx => {
  ctx.body = JSON.stringify({ version });
});

router.get(
  '/context/:userId',
  cors({
    origin: process.env.LIFF_CORS_ORIGIN,
  }),
  async ctx => {
    const { state, issuedAt } = (await redis.get(ctx.params.userId)) || {};

    ctx.body = {
      state,
      issuedAt,
    };
  }
);

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

  // Handle follow/unfollow event
  if (type === 'unfollow' || type === 'follow') {
    clearTimeout(timerId);
    return;
  }

  // Set default result
  //
  let result = {
    context: '__INIT__',
    replies: [
      {
        type: 'text',
        text: t`I cannot understand messages other than text.`,
      },
    ],
  };

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

      // When if the postback is expired,
      // i.e. If other new messages have been sent before pressing buttons,
      // Don't do anything, just ignore silently.
      //
      if (data.issuedAt !== context.issuedAt) {
        console.log('Previous button pressed.');
        clearTimeout(timerId);
        return;
      }

      input = data.input;
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

    result = await processText(
      result,
      context,
      type,
      input,
      otherFields,
      userId,
      req
    );
  } else if (type === 'message' && otherFields.message.type === 'image') {
    // Track image message type send by user
    ga(userId)
      .event({
        ec: 'UserInput',
        ea: 'MessageType',
        el: otherFields.message.type,
      })
      .send();

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
          result,
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

// Routes that is after protection of checkSignature
//
router.use('/callback', checkSignatureAndParse);
router.post('/callback', ctx => {
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

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening port', process.env.PORT);
});
async function processText(
  result,
  context,
  type,
  input,
  otherFields,
  userId,
  req
) {
  try {
    const issuedAt = Date.now();
    result = await handleInput(
      context,
      { type, input, ...otherFields },
      issuedAt,
      userId
    );
    if (!result.replies) {
      throw new Error(
        'Returned replies is empty, please check processMessages() implementation.'
      );
    }
    // Renew "issuedAt" of the resulting context.
    result.context.issuedAt = issuedAt;
  } catch (e) {
    console.error(e);
    rollbar.error(e, req);
    result = {
      context: { state: '__INIT__', data: {} },
      replies: [
        {
          type: 'text',
          text: t`Oops, something is not working. Would you please send that again?`,
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

// Graceful shutdown
// https://pm2.keymetrics.io/docs/usage/cluster-mode/#graceful-shutdown
process.on('SIGINT', async () => {
  try {
    await redis.quit();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});

// If shutdown during imageProcessing, count will be non-zero value on next deploy.
// So reset imageProcessingCount to 0 every time.
redis.set('imageProcessingCount', 0);
