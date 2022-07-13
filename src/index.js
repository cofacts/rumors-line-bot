import Koa from 'koa';
import Router from 'koa-router';
import serve from 'koa-static-server';
import path from 'path';

import rollbar from './lib/rollbar';
import { version } from '../package.json';
import webhookRouter from './webhook';
import graphqlMiddleware from './graphql';
import redis from './lib/redisClient';
import session from 'koa-session2';
import passport from 'koa-passport';
import { loginRouter, authRouter } from './auth';
import lineContentRouter from './lineContent';

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

app.use(session({}, app));
app.use(passport.initialize());
app.use(passport.session());

router.get('/', ctx => {
  ctx.body = JSON.stringify({ version });
});

router.use('/callback', webhookRouter.routes(), webhookRouter.allowedMethods());

router.use('/login', loginRouter.routes(), loginRouter.allowedMethods());
router.use('/authcallback', authRouter.routes(), authRouter.allowedMethods());
router.use(
  '/getcontent',
  lineContentRouter.routes(),
  lineContentRouter.allowedMethods()
);

if (process.env.NODE_ENV === 'production') {
  app.use(
    serve({
      rootDir: path.join(__dirname, '../liff'),
      rootPath: '/liff',

      // Set cache header for assets, but always fetch index.html
      setHeaders(res, path) {
        if (!path.match(/\.html(?:\.gz)?$/)) {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      },
    })
  );
} else {
  app.use(
    require('koa-proxies')('/liff', {
      target: `http://localhost:${process.env.LIFF_DEV_PORT}`,
      logs: true,
    })
  );
}

app.use(
  serve({
    rootDir: path.join(__dirname, '../static'),
    rootPath: '/static',
    maxage: 31536000 * 1000, // https://stackoverflow.com/a/7071880/1582110
  })
);

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
