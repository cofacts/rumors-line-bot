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

  static get client() {
    return mongoClient.getInstance().then(e => e.collection(this.collection));
  }

  /**
   *
   * @param {object} data
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
}
