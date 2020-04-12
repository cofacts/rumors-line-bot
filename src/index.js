import Koa from 'koa';
import Router from 'koa-router';
import cors from '@koa/cors';

import rollbar from './lib/rollbar';
import { version } from '../package.json';
import webhookRouter from './webhook';
import graphqlMiddleware from './graphql';
import redis from './lib/redisClient';

const app = new Koa();
const router = Router();

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

// TODO: legacy route, remove this
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
router.use('/callback', webhookRouter.routes(), webhookRouter.allowedMethods());

app.use(router.routes());
app.use(graphqlMiddleware);
app.use(router.allowedMethods());

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening port', process.env.PORT);
});

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
