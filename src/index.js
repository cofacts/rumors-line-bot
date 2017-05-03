import Koa from 'koa';
import Router from 'koa-router';
import rollbar from 'rollbar';
import koaBody from 'koa-bodyparser';

import redis from './redisClient';
import { checkSignature, captureRawBody } from './checkSignature';
import lineClient from './lineClient';
import processMessages from './processMessages';

const app = new Koa();
const router = Router();
const userIdBlacklist = (process.env.USERID_BLACKLIST || '').split(',');

rollbar.init(process.env.ROLLBAR_TOKEN, {
  environment: process.env.ROLLBAR_ENV,
});

rollbar.handleUncaughtExceptionsAndRejections();

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    rollbar.handleError(err, ctx.request);
    throw err;
  }
});

app.use(captureRawBody);

app.use(
  koaBody({
    formLimit: '1mb',
    jsonLimit: '10mb',
    textLimit: '10mb',
  })
);

router.get('/', ctx => {
  ctx.body = JSON.stringify({
    redis: redis.server_info,
  });
});

// Routes that is after protection of checkSignature
//
router.use('/callback', checkSignature);
router.post('/callback', ctx => {
  // Allow free-form request handling.
  // Don't wait for anything before returning 200.
  //
  ctx.request.body.events.forEach(
    async ({ type, replyToken, source: { userId }, ...otherFields }) => {
      if (userIdBlacklist.indexOf(userId) !== -1) {
        // User blacklist
        console.log(`[LOG] Blocked user INPUT =\n${JSON.stringify({
          type,
          userId,
          ...otherFields,
        })}\n`);
        return;
      }

      // Set default result
      //
      let result = {
        context: '__INIT__',
        replies: [
          {
            type: 'text',
            text: '我們還不支援文字以外的訊息唷！',
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
          if (data.issuedAt !== context.issuedAt) return;

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

        try {
          // When this message is received.
          //
          const issuedAt = Date.now();

          result = await processMessages(
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
          //
          result.context.issuedAt = issuedAt;
        } catch (e) {
          console.error(e);
          rollbar.handleError(e, ctx.request);

          result = {
            context: { state: '__INIT__', data: {} },
            replies: [
              {
                type: 'text',
                text: '糟糕，bot 故障了。可以再傳一次嗎？ QQ',
              },
            ],
          };
        }

        console.log(
          '[LOG]',
          `CONTEXT =\n${JSON.stringify(context)}\n`,
          `INPUT =\n${JSON.stringify({ type, userId, ...otherFields })}\n`,
          `OUTPUT =\n${JSON.stringify(result)}\n`
        );
      }

      // console.log('DEBUGGG', result.replies);

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
