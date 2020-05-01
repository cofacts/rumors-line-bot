import fs from 'fs';
import path from 'path';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa';
import redis from 'src/lib/redisClient';

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
  schemaDirectives: fs
    .readdirSync(path.join(__dirname, 'directives'))
    .reduce((directives, fileName) => {
      directives[
        fileName.replace(/\.js$/, '')
      ] = require(`./directives/${fileName}`).default;
      return directives;
    }, {}),
});

/**
 * @param {{ctx: Koa.Context}}
 * @returns {object}
 */
export async function getContext({ ctx: { req } }) {
  const [userId, nonce] = Buffer.from(
    (req.headers.authorization || '').replace(/^basic /, ''),
    'base64'
  )
    .toString()
    .split(':');

  let userContext = null;
  if (userId && nonce) {
    const context = await redis.get(userId);
    if (context && context.nonce === nonce) {
      userContext = context;
    }
  }

  return {
    userId,
    userContext,
  };
}

const server = new ApolloServer({
  schema,
  context: getContext,
});

export default server.getMiddleware();
