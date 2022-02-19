import Bull from 'bull';

export const groupEventQueue = new Bull('groupEventQueue', {
  redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  // limiter: { max: 600, duration: 10 * 1000 },
});
export const expiredGroupEventQueue = new Bull('expiredGroupEventQueue', {
  redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  // limiter: { max: 600, duration: 10 * 1000 },
});
