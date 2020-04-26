import Koa from 'koa';
import Router from 'koa-router';
import serve from 'koa-static-server';
import path from 'path';

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

router.use('/callback', webhookRouter.routes(), webhookRouter.allowedMethods());

if (process.env.NODE_ENV === 'production') {
  app.use(
    serve({ rootDir: path.join(__dirname, '../liff'), rootPath: '/liff' })
  );
} else {
  app.use(
    require('koa-proxies')('/liff', {
      target: `http://localhost:${process.env.LIFF_DEV_PORT}`,
      logs: true,
    })
  );
}
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
