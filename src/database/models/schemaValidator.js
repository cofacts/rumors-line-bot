import Ajv from 'ajv';

const ajv = new Ajv();

const SCHEMAS = {
  userArticleLink: require('./userArticleLink.json'),
  userSettings: require('./userSettings.json'),
  appVariable: require('./appVariable.json'),
};

const ClassTable = {
  Date: Date,
};

ajv.addKeyword('instanceOf', {
  compile: function (className) {
    var Class = ClassTable[className];
    return function (data) {
      return data instanceof Class;
    };
  },
});

export function compile(schemaName) {
  return (data) => {
    const validate = ajv.compile(SCHEMAS[schemaName]);
    const valid = validate(data);
    return { valid, errors: validate.errors };
  };
}

export const validators = {
  userArticleLink: compile('userArticleLink'),
  userSettings: compile('userSettings'),
  appVariable: compile('appVariable'),
};
