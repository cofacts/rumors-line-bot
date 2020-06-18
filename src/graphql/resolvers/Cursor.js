const { GraphQLScalarType, Kind } = require('graphql');

function decodeToPaginationData(encoded) {
  const value = +Buffer.from(encoded, 'base64').toString('utf8');
  if (isNaN(value))
    throw new Error(
      'Should be a base64 string that can decode to pagination data'
    );
  return value;
}

export default new GraphQLScalarType({
  name: 'Cursor',
  parseLiteral(ast) {
    if (ast.kind !== Kind.STRING) {
      throw new Error('Should be a base64 string');
    }

    return decodeToPaginationData(ast.value);
  },
  parseValue(source) {
    return decodeToPaginationData(source);
  },
  serialize(paginationData) {
    if (paginationData === null) return null;
    return Buffer.from(paginationData.toString(), 'utf8').toString('base64');
  },
});
