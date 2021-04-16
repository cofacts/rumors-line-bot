import fs from 'fs';
import path from 'path';
import { ApolloServer } from 'apollo-server-koa';
import { makeExecutableSchema } from '@graphql-tools/schema';

import redis from 'src/lib/redisClient';
import { verifyIDToken } from './lineClient';
import { verify, read } from 'src/lib/jwt';

export const linebotSchema = makeExecutableSchema({
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
  const authorization = req.headers.authorization || '';
  if (authorization.toLowerCase().startsWith('line ')) {
    const idToken = authorization.replace(/^line /i, '');
    const parsed = await verifyIDToken(idToken);

    if (!parsed || !parsed.sub) {
      return EMPTY_CONTEXT;
    }

    // The user may have no context at all
    // (Brand-new user activating rich mebnu)
    // At least give empty context
    //
    const context = (await redis.get(parsed.sub)) || {};

    return {
      userId: parsed.sub,
      userContext: context,
    };
  } else if (authorization.toLowerCase().startsWith('bearer ')) {
    const jwt = authorization.replace(/^Bearer /i, '');
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

  return EMPTY_CONTEXT;
}

const server = new ApolloServer({
  schema: linebotSchema,
  context: getContext,
});

export default server.getMiddleware();
