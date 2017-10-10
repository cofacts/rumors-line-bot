import crypto from 'crypto';
import rollbar from './rollbar';

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
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(ctx.rawBody)
    .digest('base64');

  if (hash === ctx.request.headers['x-line-signature']) {
    await next();
  } else {
    // TODO:
    // When switching to the official NodeJS SDK, the following error handling should also be ported
    // to: https://line.github.io/line-bot-sdk-nodejs/pages/guide/webhook.html#error-handling
    ctx.status = 401;
    ctx.body = 'x-line-signature and hash does not match';

    rollbar.warning(ctx.body, ctx.request, {
      hash,
    });
  }
}
