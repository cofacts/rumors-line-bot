import rollbar from './rollbar';
import { validateSignature } from '@line/bot-sdk';
import getRawBody from 'raw-body';

const SECRET = process.env.LINE_CHANNEL_SECRET;

async function checkSignatureAndParse(ctx, next) {
  const raw = await getRawBody(ctx.req, {
    length: ctx.request.headers['content-length'],
  });
  const signature = ctx.request.headers['x-line-signature'];

  if (!validateSignature(raw, SECRET, signature)) {
    ctx.status = 401;
    ctx.body = 'x-line-signature and hash does not match';

    rollbar.warning(ctx.body, ctx.request, {
      signature,
    });
  } else {
    ctx.request.body = JSON.parse(raw.toString('utf8'));
    await next();
  }
}

export default checkSignatureAndParse;
