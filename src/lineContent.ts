import Router from 'koa-router';
import lineClient from 'src/webhook/lineClient';
import { verify, read } from 'src/lib/jwt';
import ua from 'universal-analytics';
import { insertEventBatch } from './lib/bq';

const lineContentRouter = new Router();

lineContentRouter.get('/', async (ctx) => {
  const jwt = ctx.query.token;
  if (!jwt || !verify(jwt)) {
    const err = new Error('`token` is invalid or expired.');
    throw Object.assign(err, { status: 400, expose: true });
  }

  const parsed = read(jwt);

  const response = await lineClient.getContent(parsed.messageId);

  const contentType = response.headers.get('content-type') ?? '';
  const contentLength = response.headers.get('content-length') ?? '';

  const visitor = ua(process.env.GA_ID ?? '');
  visitor.screenview('Content Proxy', 'rumors-line-bot');
  visitor.event({
    ec: 'ContentProxy',
    ea: 'Forward',
    el: contentType,
    ev: contentLength,
  });
  visitor.send();

  insertEventBatch({
    createdAt: new Date(),
    text: null,
    messageSource: null,
    events: [
      {
        category: 'ContentProxy',
        action: 'Forward',
        label: contentType,
        value: +contentLength,
        time: new Date(),
      },
    ],
  });

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
