import Koa from 'koa';
import Router from 'koa-router';
import rollbar from 'rollbar';
import koaBody from 'koa-bodyparser';

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
  ctx.body = 'Hello world!';
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log('Listening port', process.env.PORT);
});
