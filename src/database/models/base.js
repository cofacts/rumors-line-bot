import { compile } from './schemaValidator';
import client from '../mongoClient';

export default class Base {
  constructor(collection) {
    this.collection = collection;
    this.validator = compile(collection);
  }

  async create(data) {
    const { valid, errors } = this.validator(data);
    if (valid) {
      const result = await (await client.getInstance()).insert(
        this.collection,
        data
      );
      return result.ops[0];
    }
    if (errors) {
      throw new Error(JSON.stringify(errors, null, 2));
    }
  }
}
