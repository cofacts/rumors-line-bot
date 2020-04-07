import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

// Database Name
const dbName = 'cofacts';

export default class CofactsMongoClient {
  /**
   * @type {?Promise<CofactsMongoClient>}
   */
  static _instance = null;

  static async getInstance() {
    if (this._instance === null) {
      this._instance = new Promise(async (resolve, reject) => {
        const client = new CofactsMongoClient(MONGODB_URI);
        try {
          await client.mongoClient.connect();
          resolve(client);
        } catch (e) {
          reject(e);
        }
      });
    }
    return this._instance;
  }

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
    return this.mongoClient.close();
  }
}
