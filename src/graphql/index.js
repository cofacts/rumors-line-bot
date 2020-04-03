import fs from 'fs';
import path from 'path';
import { ApolloServer } from 'apollo-server-koa';

const server = new ApolloServer({
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

export default server.getMiddleware();
