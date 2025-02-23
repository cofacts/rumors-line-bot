import fetch from 'node-fetch';
import rollbar from './rollbar';
import { format } from 'url';
import Dataloader from 'dataloader';

const API_URL = process.env.API_URL || 'https://dev-api.cofacts.tw/graphql';

type QV = {
  query: string;
  variables?: object;
};

type Resp = { data: object | null; errors: { message: string }[] | undefined };

// Maps URL to dataloader. Cleared after batched request is fired.
// Exported just for unit test.
export const loaders: Record<string, Dataloader<QV, Resp>> = {};

/**
 * Returns a dataloader instance that can send query & variable to the GraphQL endpoint specified by `url`.
 *
 * The dataloader instance is automatically created when not exist for the specified `url`, and is
 * cleared automatically when the batch request fires.
 *
 * @param url - GraphQL endpoint URL
 * @returns A dataloader instance that loads response of the given {query, variable}
 */
function getGraphQLRespLoader(url: string) {
  if (loaders[url]) return loaders[url];

  return (loaders[url] = new Dataloader<QV, Resp>(async (queryAndVariables) => {
    // Clear dataloader so that next batch will get a fresh dataloader
    delete loaders[url];

    // Implements Apollo's transport layer batching
    // https://www.apollographql.com/blog/apollo-client/performance/query-batching/#1bce
    //
    return (
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-app-secret': process.env.APP_SECRET ?? '',
        },
        body: JSON.stringify(queryAndVariables),
      })
    ).json();
  }));
}

// Usage:
//
// import gql from './util/GraphQL';
// gql`query($var: Type) { foo }`({var: 123}).then(...)
//
// gql`...`() returns a promise that resolves to immutable Map({data, errors}).
//
// We use template string here so that Atom's language-babel does syntax highlight
// for us.
//
export default (query: TemplateStringsArray, ...substitutions: string[]) =>
  <QueryResp extends object, Variable>(
    variables: Variable,
    search?: Record<string, string | number>
  ) => {
    const queryAndVariable: QV = {
      query: String.raw(query, ...substitutions),
    };

    if (variables) queryAndVariable.variables = variables;

    const URL = `${API_URL}${format({ query: search })}`;

    return getGraphQLRespLoader(URL)
      .load(queryAndVariable)
      .then((resp) => {
        // We cannot get status code of individual request in transport layer batching.
        // but we can guess that it's not 2xx if `data` is null or does not exist.
        // Ref: https://github.com/graphql/graphql-over-http/blob/main/spec/GraphQLOverHTTP.md#status-codes
        //
        if (!('data' in resp) || !resp.data || typeof resp.data !== 'object') {
          const errorStr =
            'errors' in resp && Array.isArray(resp.errors)
              ? resp.errors.map(({ message }) => message).join('\n')
              : 'Unknown error';

          throw new Error(`GraphQL Error: ${errorStr}`);
        }

        if ('errors' in resp && resp.errors) {
          console.error('GraphQL operation contains error:', resp.errors);
          rollbar.error(
            'GraphQL error',
            {
              body: JSON.stringify(queryAndVariable),
              url: URL,
            },
            { resp }
          );
        }

        return resp as GqlResponse<QueryResp>;
      });
  };
