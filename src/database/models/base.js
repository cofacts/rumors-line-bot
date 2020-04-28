import { compile } from './schemaValidator';
import mongoClient from '../mongoClient';

export default class Base {
  /**
   * @returns {string} collection
   */
  static get collection() {
    throw new Error('not yet implement');
  }

  static get validator() {
    return compile(this.collection);
  }

  /**
   * @returns {Promise<import('mongodb').Collection>}
   */
  static get client() {
    return mongoClient.getInstance().then(e => e.collection(this.collection));
  }

  static async collectionExists() {
    return mongoClient
      .getInstance()
      .then(e => e.db.listCollections({ name: this.collection }).hasNext());
  }

  /**
   *
   * @param {object} data
   * @returns {object}
   */
  static async create(data) {
    const { valid, errors } = this.validator(data);
    if (valid) {
      const result = await (await this.client).insertOne(data);
      return result.ops[0];
    }
    if (errors) {
      throw new Error(JSON.stringify(errors, null, 2));
    }
  }

  /**
   * An atomic and upsert enabled operation.
   * @param {import('mongodb').FilterQuery} query
   * @param {object} $set
   * @param {object} $setOnInsert
   * @returns {object}
   */
  static async findOneAndUpdate(query, $set, $setOnInsert) {
    /**
     * TODO
     * Partial validate on query and data
     */
    const update = {};

    if ($set) {
      update['$set'] = $set;
    }

    if ($setOnInsert) {
      update['$setOnInsert'] = $setOnInsert;
    }

    return (await (await this.client).findOneAndUpdate(query, update, {
      upsert: true,
      returnOriginal: false,
    })).value;
  }
}
