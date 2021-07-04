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
    try {
      return JSON.parse((await this.find({ _id: varName }))[0].value);
    } catch (e) {
      // Resolves to undefined if not set at all
      return;
    }
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
