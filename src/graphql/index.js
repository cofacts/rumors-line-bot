import { ApolloServer } from 'apollo-server-koa';
import { stitchSchemas } from '@graphql-tools/stitch';

import linebotSchema from './linebotSchema';
import cofactsSchema from './cofactsSchema';
import redis from 'src/lib/redisClient';
import { verifyIDToken } from './lineClient';

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
  }

  return EMPTY_CONTEXT;
}

export const schema = stitchSchemas({
  subschemas: [
    linebotSchema,
    {
      schema: cofactsSchema,
      merge: {
        CofactsAPIArticle: {
          fieldName: 'GetArticle',
          selectionSet: '{ id }',
          args: (articleObj) => ({ id: articleObj.id }),
        },
      },
    },
  ],
});

const server = new ApolloServer({
  schema,
  context: getContext,
});

export default server.getMiddleware();
