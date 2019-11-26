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
} from './fileUpload';
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
  userId,
  otherFields
) => {
  if (userIdBlacklist.indexOf(userId) !== -1) {
    // User blacklist
    console.log(
      `[LOG] Blocked user INPUT =\n${JSON.stringify({
        type,
        userId,
        ...otherFields,
      })}\n`
    );
    return;
  }

  // Handle follow/unfollow event
  if (type === 'unfollow' || type === 'follow') {
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

    const context = (await redis.get(userId)) || {};

    var res = await downloadFile(otherFields.message.id);
    uploadImageFile(res.clone(), otherFields.message.id);
    await saveImageFile(res, otherFields.message.id);
    var text = await processImage(otherFields.message.id);
    result = await processText(
      result,
      context,
      type,
      text,
      otherFields,
      userId,
      req
    );
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
      let { userId } = source;
      if (source.type === 'user') {
        singleUserHandler(ctx.request, type, replyToken, userId, otherFields);
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
  // 60 chars per line, each prepended with [[LOG]]
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
