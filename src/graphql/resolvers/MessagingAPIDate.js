const { GraphQLScalarType, Kind } = require('graphql');

function isMessagingAPIDate(string) {
  return string.match(/^\d{8}$/);
}

export default new GraphQLScalarType({
  name: 'MessagingAPIDate',
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING || !isMessagingAPIDate(ast.value)) {
      throw new Error('Should be a string of "yyyyMMdd"');
    }
    return ast.value;
  },
  parseValue(source) {
    if (!isMessagingAPIDate(source)) {
      throw new Error('Should be a string of "yyyyMMdd"');
    }

    return source;
  },
});
