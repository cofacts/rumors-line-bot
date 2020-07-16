import getRawBody from 'raw-body';
async function checkSignatureAndParse(ctx, next) {
  const raw = await getRawBody(ctx.req, {
    length: ctx.request.headers['content-length'],
  });
  ctx.request.body = JSON.parse(raw.toString('utf8'));
  await next();
}

export default checkSignatureAndParse;
