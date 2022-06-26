import Router from 'koa-router';
import lineClient from 'src/webhook/lineClient';
import { verify, read } from 'src/lib/jwt';

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
  ctx.response.set('content-length', response.headers.get('content-length'));
  ctx.response.set('content-type', response.headers.get('content-type'));
  ctx.response.set(
    'content-disposition',
    `attachment; filename=${parsed.messageId}`
  );
  ctx.status = 200;
  ctx.body = response.body;
});

export default lineContentRouter;
