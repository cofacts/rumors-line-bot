import { writable } from 'svelte/store';

const params = new URLSearchParams(location.search);

/**
 * Boolean value indicating if we are in the middle of LIFF redirect.
 * Ref: https://www.facebook.com/groups/linebot/permalink/2380490388948200/?comment_id=2380868955577010
 */
export const isDuringLiffRedirect = !!params.get('liff.state');

/**
 * Current page. Initialized from URL param.
 */
export const page = writable(params.get('p'));

/**
 * Original JWT token from URL param.
 */
export const token = params.get('token');

/**
 * Data parsed from JWT token (Javascript object).
 *
 * Note: the JWT token is taken from URL and is not validated, thus its data cannot be considered as
 * safe from XSS.
 */
export const parsedToken = token ? JSON.parse(atob(token.split('.')[1])) : {};

/**
 * Usage: gql`query {...}`(variables)
 *
 * @returns {(variables: object): Promise<object>}
 */
export const gql = (query, ...substitutions) => variables => {
  const queryAndVariable = {
    query: String.raw(query, ...substitutions),
  };

  if (variables) queryAndVariable.variables = variables;

  let status;

  return fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(queryAndVariable),
  })
    .then(r => {
      status = r.status;
      return r.json();
    })
    .then(resp => {
      if (status === 400) {
        throw new Error(
          `GraphQL Error: ${resp.errors
            .map(({ message }) => message)
            .join('\n')}`
        );
      }
      if (resp.errors) {
        // When status is 200 but have error, just print them out.
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
      return resp;
    });
};
