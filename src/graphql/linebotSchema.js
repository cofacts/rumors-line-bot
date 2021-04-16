import fs from 'fs';
import path from 'path';
import { makeExecutableSchema } from '@graphql-tools/schema';

const lineSchema = makeExecutableSchema({
  typeDefs: fs.readFileSync(path.join(__dirname, `./typeDefs.graphql`), {
    encoding: 'utf-8',
  }),
  resolvers: fs
    .readdirSync(path.join(__dirname, 'resolvers'))
    .reduce((resolvers, fileName) => {
      resolvers[
        fileName.replace(/\.js$/, '')
      ] = require(`./resolvers/${fileName}`).default;
      return resolvers;
    }, {}),
  schemaDirectives: fs
    .readdirSync(path.join(__dirname, 'directives'))
    .reduce((directives, fileName) => {
      directives[
        fileName.replace(/\.js$/, '')
      ] = require(`./directives/${fileName}`).default;
      return directives;
    }, {}),
  resolverValidationOptions: {
    // MongoDBDocument, Connection and ConnectionEdge are for consistent interface.
    // We don't query fields with these type, thus no __resolveType is needed.
    //
    // Ref: https://github.com/apollographql/apollo-server/issues/1075#issuecomment-440768737
    requireResolversForResolveType: false,
  },
});

export default lineSchema;
