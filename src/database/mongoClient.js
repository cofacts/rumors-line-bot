import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

// Somewhere outside the class:
//
async function instantiateClientAndConnect() {
  const client = new CofactsMongoClient(MONGODB_URI, {
    useUnifiedTopology: true,
  });
  await client.mongoClient.connect();
  return client;
}

export default class CofactsMongoClient {
  /**
   * @type {?Promise<CofactsMongoClient>}
   */
  static _instance = null;

  static async getInstance() {
    return (this._instance = this._instance || instantiateClientAndConnect());
  }

  /**
   * Use CofactsMongoClient.getInstance(). Do not use constructor
   *
   * @param {string} uri
   * @param {import('mongodb').MongoClientOptions} options
   */
  constructor(uri, options) {
    this.mongoClient = new MongoClient(uri, options);
  }

  get db() {
    return this.mongoClient.db();
  }

  /**
   *
   * @param {string} name
   */
  async collection(name) {
    return this.db.collection(name);
  }

  async close() {
    await this.mongoClient.close();
    this._instance = null;
  }
}
