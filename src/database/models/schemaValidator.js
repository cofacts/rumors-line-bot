import Ajv from 'ajv';

const ajv = new Ajv();

const SCHEMAS = {
  userArticleLink: require('./userArticleLink.json'),
  userSettings: require('./userSettings.json'),
};

const ClassTable = {
  Date: Date,
};

ajv.addKeyword('instanceOf', {
  compile: function(className) {
    var Class = ClassTable[className];
    return function(data) {
      return data instanceof Class;
    };
  },
});

export function validate(schemaName, data) {
  const valid = ajv.validate(SCHEMAS[schemaName], data);
  return { valid, errors: ajv.errors };
}

export function compile(schemaName) {
  return data => {
    const validate = ajv.compile(SCHEMAS[schemaName]);
    const valid = validate(data);
    return { valid, errors: validate.errors };
  };
}
