import crypto from 'crypto';

export default async function checkSignature(ctx, next) {
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(Buffer.from(JSON.stringify(ctx.request.body)))
    .digest('base64');

  if (hash === ctx.request.headers['x-line-signature']) {
    await next();
  } else {
    ctx.status = 401;
    ctx.body = 'x-line-signature and hash does not match';
  }
}
