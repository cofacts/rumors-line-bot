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

  async insert(collection, data) {
    return this.db.collection(collection).insertOne(data);
  }

  async find(collection, query) {
    return this.db
      .collection(collection)
      .find(query)
      .toArray();
  }

  async close() {
    return this.mongoClient.close();
  }
}
