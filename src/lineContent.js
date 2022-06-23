import Router from 'koa-router';
import { downloadFile } from './webhook/handlers/fileHandler';
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
  const result = await downloadFile(parsed.messageId);

  // let mimeType = 'image/jpeg';
  // ctx.response.set('content-type', mimeType);
  ctx.response.set(
    'content-disposition',
    `attachment; filename=${parsed.messageId}`
  );
  ctx.status = 200;
  ctx.body = result.body;
});

export default lineContentRouter;
