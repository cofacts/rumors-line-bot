import Router from 'koa-router';
import lineClient from 'src/webhook/lineClient';
import { verify, read } from 'src/lib/jwt';
import ua from 'universal-analytics';

const lineContentRouter = Router();

lineContentRouter.get('/', async ctx => {
  const jwt = ctx.query.token;
  if (!jwt || !verify(jwt)) {
    const err = new Error('`token` is invalid or expired.');
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const parsed = read(jwt);

  const response = await lineClient.getContent(parsed.messageId);

  const contentType = response.headers.get('content-type');
  const contentLength = response.headers.get('content-length');

  const visitor = ua(process.env.GA_ID);
  visitor.screenview('Content Proxy', 'rumors-line-bot');
  visitor.event({
    ec: 'ContentProxy',
    ea: 'Forward',
    el: contentType,
    ev: contentLength,
  });
  visitor.send();

  ctx.response.set('content-type', contentType);
  ctx.response.set('content-length', contentLength);
  ctx.response.set(
    'content-disposition',
    `attachment; filename=${parsed.messageId}`
  );
  ctx.status = 200;
  ctx.body = response.body;
});

export default lineContentRouter;
