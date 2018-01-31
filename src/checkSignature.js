import rollbar from './rollbar';
import { validateSignature } from '@line/bot-sdk';

const SECRET = process.env.LINE_CHANNEL_SECRET;

export function captureRawBody(ctx, next) {
  // Some special characters (like 😨) will be altered after being processed by koa-bodyparser.
  // This makes checkSignature() fail to recognize data from LINE.
  // We capture request stream here to collect raw body string for checkSignature()
  //
  let rawBody = '';
  ctx.req
    .addListener('data', chunk => {
      rawBody += chunk;
    })
    .addListener('end', () => {
      ctx.rawBody = rawBody;
    });
  return next();
}

export async function checkSignature(ctx, next) {
  const signature = ctx.request.headers['x-line-signature'];

  if (!validateSignature(ctx.rawBody, SECRET, signature)) {
    ctx.status = 401;
    ctx.body = 'x-line-signature and hash does not match';

    rollbar.warning(ctx.body, ctx.request, {
      signature,
    });
  } else {
    return next();
  }
}
