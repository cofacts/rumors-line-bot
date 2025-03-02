const path = require('path');

require('dotenv').config({
  path: path.resolve(process.cwd(), '.env.sample'),
});

// Must import Client after dotenv, so that MONGODB_URI in mongoClient file can get correct value
const { default: Client } = require('../src/database/mongoClient');
const { default: redis } = require('../src/lib/redisClient');

afterAll(async () => {
  // Close MongoDB connection after each test
  await (await Client.getInstance()).close();
  // Close redis connection after each test
  await redis.quit();
});
