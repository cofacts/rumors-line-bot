import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

// Database Name
const dbName = 'cofacts';

// Somewhere outside the class:
//
async function instantiateClientAndConnect() {
  const client = new CofactsMongoClient(MONGODB_URI);
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
    return this.mongoClient.db(dbName);
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
