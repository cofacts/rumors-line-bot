import Base from './base';

class AppVariable extends Base {
  static get collection() {
    return 'appVariable';
  }

  /**
   * @param {string} varName - the name of app variable to read
   * @returns {Promise<any>} - variable value
   */
  static async get(varName) {
    const result = await this.find({ _id: varName });
    if (result.length === 0) {
      // Resolves to undefined if varName is not set previously
      return;
    }

    return JSON.parse(result[0].value);
  }

  /**
   *
   * @param {string} varName - the name of app variable to write
   * @param {any} value
   * @returns {Promise<AppVariable>}
   */
  static async set(varName, value) {
    const valueStr = JSON.stringify(value);

    return this.findOneAndUpdate({ _id: varName }, { value: valueStr });
  }
}

export default AppVariable;
