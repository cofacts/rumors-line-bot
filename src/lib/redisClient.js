import redis from 'redis';
import rollbar from './rollbar';

const client = redis.createClient(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379'
);

const DEFAULT_EXPIRE = 86400 * 30; /* 30 days by default */
/**
 *
 * @param {string} key
 * @param {*} value
 * @param {number} expire - Default to 1 day. Set to 0 to persist.
 */
function set(key, value, expire = DEFAULT_EXPIRE) {
  if (typeof key !== 'string') {
    throw new Error('key of `set(key, value)` must be a string.');
  }
  return new Promise((resolve, reject) => {
    const expArgs = expire ? ['EX', expire] : [];

    client.set([key, JSON.stringify(value), ...expArgs], (err, reply) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

function get(key) {
  if (typeof key !== 'string') {
    throw new Error('key of `get(key)` must be a string.');
  }
  return new Promise((resolve, reject) => {
    client.get(key, (err, reply) => {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(reply));
        } catch (e) {
          // Gracefully fallback, in case the stuff in redis is a mess
          //
          console.error(e);
          rollbar.error(e);
          resolve({});
        }
      }
    });
  });
}

function del(key) {
  return new Promise((resolve, reject) => {
    client.del(key, (err, reply) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

function incr(key) {
  return new Promise((resolve, reject) => {
    client.incr(key, (err, reply) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

function decr(key) {
  return new Promise((resolve, reject) => {
    client.decr(key, (err, reply) => {
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

function quit() {
  return new Promise((resolve, reject) => {
    client.quit(err => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

export default {
  set,
  get,
  del,
  incr,
  decr,
  quit,
};
