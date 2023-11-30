import redis from 'redis';
import rollbar from './rollbar';

const client = redis.createClient(
  process.env.REDIS_URL || 'redis://127.0.0.1:6379'
);

function set(key, value) {
  /* istanbul ignore if */
  if (typeof key !== 'string') {
    throw new Error('key of `set(key, value)` must be a string.');
  }
  return new Promise((resolve, reject) => {
    client.set(key, JSON.stringify(value), (err, reply) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

function get(key) {
  /* istanbul ignore if */
  if (typeof key !== 'string') {
    throw new Error('key of `get(key)` must be a string.');
  }
  return new Promise((resolve, reject) => {
    client.get(key, (err, reply) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(reply));
        } catch (e) /* istanbul ignore next */ {
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
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

/** Push value to the list at the specified key */
function push(key, value) {
  return new Promise((resolve, reject) => {
    client.rpush(key, JSON.stringify(value), (err, reply) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

/** Get length of the list at the specified key */
function len(key) {
  return new Promise((resolve, reject) => {
    client.llen(key, (err, reply) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        resolve(reply);
      }
    });
  });
}

/** Get the list at the specified key */
function getList(key) {
  return new Promise((resolve, reject) => {
    client.lrange(key, 0, -1, (err, reply) => {
      /* istanbul ignore if */
      if (err) {
        reject(err);
      } else {
        resolve(reply.map((s) => JSON.parse(s)));
      }
    });
  });
}

function quit() {
  return new Promise((resolve, reject) => {
    client.quit((err) => {
      /* istanbul ignore if */
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
  push,
  len,
  getList,
  quit,
};
