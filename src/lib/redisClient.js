import { createClient } from 'redis';
import rollbar from './rollbar';

// Reuse this connected client for future method calls
const clientPromise = createClient(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379'
)
  .on('error', (err) => console.log('[redisClient]', err))
  .connect();

async function set(key, value) {
  if (typeof key !== 'string') {
    throw new Error('key of `set(key, value)` must be a string.');
  }

  return (await clientPromise).set(key, JSON.stringify(value));
}

async function get(key) {
  if (typeof key !== 'string') {
    throw new Error('key of `get(key)` must be a string.');
  }
  const reply = (await clientPromise).get(key);
  try {
    return JSON.parse(reply);
  } catch (e) {
    // Gracefully fallback, in case the stuff in redis is a mess
    //
    console.error(e);
    rollbar.error(e);
    return {};
  }
}

async function del(key) {
  return (await clientPromise).del(key);
}

async function incr(key) {
  return (await clientPromise).incr(key);
}

async function decr(key) {
  return (await clientPromise).decr(key);
}

async function quit() {
  return (await clientPromise).quit();
}

export default {
  set,
  get,
  del,
  incr,
  decr,
  quit,
};
