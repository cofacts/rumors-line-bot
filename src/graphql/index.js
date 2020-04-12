import fs from 'fs';
import path from 'path';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa';

export const schema = makeExecutableSchema({
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
});

const server = new ApolloServer({ schema });

export default server.getMiddleware();
