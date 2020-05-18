import fs from 'fs';
import path from 'path';
import { ApolloServer, makeExecutableSchema } from 'apollo-server-koa';
import redis from 'src/lib/redisClient';
import { verify, read } from 'src/lib/jwt';

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

// Empty context for non-auth public APIs
const EMPTY_CONTEXT = {
  userId: null,
  userContext: null,
};

/**
 * @param {{ctx: Koa.Context}}
 * @returns {object}
 */
export async function getContext({ ctx: { req } }) {
  const jwt = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (!jwt || !verify(jwt)) {
    return EMPTY_CONTEXT;
  }

  const parsed = read(jwt);

  if (!parsed || !parsed.sub) {
    return EMPTY_CONTEXT;
  }

  const context = await redis.get(parsed.sub);

  return {
    userId: parsed.sub,
    userContext:
      context &&
      context.data &&
      parsed.sessionId &&
      context.data.sessionId === parsed.sessionId
        ? context
        : null,
  };
}

const server = new ApolloServer({
  schema,
  context: getContext,
});

export default server.getMiddleware();
