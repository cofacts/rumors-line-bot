import redis from 'redis';
import rollbar from './rollbar';

const client = redis.createClient(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379'
);

function set(key, value) {
  if (typeof key !== 'string') {
    throw new Error('key of `set(key, value)` must be a string.');
  }
  return new Promise((resolve, reject) => {
    client.set(key, JSON.stringify(value), (err, reply) => {
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

export default {
  set,
  get,
  del,
};
