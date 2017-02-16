import Koa from 'koa';
import Router from 'koa-router';
import rollbar from 'rollbar';
import koaBody from 'koa-bodyparser';

import redis from './redisClient';
import checkSignature from './checkSignature';
import lineClient from './lineClient';

const app = new Koa();
const router = Router();

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

app.use(koaBody({
  formLimit: '1mb',
  jsonLimit: '10mb',
  textLimit: '10mb',
}));

router.get('/', (ctx) => {
  ctx.body = JSON.stringify({
    redis: redis.server_info,
  });
});

// Routes that is after protection of checkSignature
//
router.use('/callback', checkSignature);
router.post('/callback', (ctx) => {
  // Allow free-form request handling.
  // Don't wait for anything before returning 200.
  //
  ctx.request.body.events.forEach(({
    type,
    // timestamp,
    // source,
    ...otherFields
  }) => {
    switch (type) {
      case 'message':
        {
          if (otherFields.message.type === 'text') {
            lineClient('/message/reply', {
              replyToken: otherFields.replyToken,
              messages: [{
                type: 'text',
                text: otherFields.message.text,
              }],
            });
          }
          break;
        }
      case 'postback':
        {
          break;
        }
      default:
        break;
    }
  });

  ctx.status = 200;
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening port', process.env.PORT);
});
