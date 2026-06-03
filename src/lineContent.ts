import Router from 'koa-router';
import lineClient from 'src/webhook/lineClient';
import { verify, read } from 'src/lib/jwt';
import ua from 'universal-analytics';
import { insertEventBatch } from './lib/bq';

const lineContentRouter = new Router();

const FALLBACK_CONTENT_TYPE: Record<string, string> = {
  image: 'image/jpeg',
  video: 'video/mp4',
  audio: 'audio/m4a',
};

lineContentRouter.get('/', async (ctx) => {
  const jwt = ctx.query.token;
  if (!jwt || !verify(jwt)) {
    const err = new Error('`token` is invalid or expired.');
    throw Object.assign(err, { status: 400, expose: true });
  }

  const parsed = read(jwt);

  const response = await lineClient.getContent(parsed.messageId);

  let contentType = response.headers.get('content-type') ?? '';
  const contentLength = response.headers.get('content-length') ?? '';

  // LINE occasionally returns application/octet-stream for certain image/audio/video formats.
  // Fall back to a sensible Content-Type based on the message type stored in the JWT.
  const contentTypePrefix = contentType.split('/')[0].toLowerCase();
  const expectedMessageType: string | undefined = parsed.messageType;
  if (
    expectedMessageType &&
    !['image', 'audio', 'video'].includes(contentTypePrefix)
  ) {
    const fallback = FALLBACK_CONTENT_TYPE[expectedMessageType];
    if (fallback) {
      console.warn(
        `[lineContent] LINE returned unexpected content-type "${contentType}" for ${expectedMessageType} message ${parsed.messageId}. Falling back to "${fallback}".`
      );
      contentType = fallback;
    }
  }

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
    userId: null,
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
