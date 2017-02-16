import redis from 'redis';

export default redis.createClient(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
