// ./index.js contains imports to redisClient, which should be mocked in unit tests.
jest.mock('src/lib/redisClient');

import { graphql } from 'graphql';
import { schema } from './';

/**
 * Executes graphql query against the current GraphQL schema.
 *
 * Usage:
 * const result = await gql`query{...}`(variable)
 *
 * @returns {(variable: Object, context: Object) => Promise<GraphQLResult>}
 */
function gql(query, ...substitutes) {
  return (variables, context = {}) =>
    graphql(
      schema,
      String.raw(query, ...substitutes),
      null,
      context,
      variables
    );
}

export { gql };
