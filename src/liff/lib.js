import { writable } from 'svelte/store';
import { t } from 'ttag';

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
const urlToken = params.get('token');

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
  let lineIDToken;
  if (!urlToken) {
    lineIDToken = liff.getIDToken();
    if (!lineIDToken) return Promise.reject('gql Error: token not set.');
  }
  const token = urlToken ? `Bearer ${urlToken}` : `line ${lineIDToken}`;

  return fetch('/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
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
          { body: JSON.stringify(queryAndVariable) },
          { resp }
        );
      }
      return resp;
    });
};

/**
 * Prevent users from proceeding with external browsers.
 * Useful when the following process involves functions only available within LINE client,
 * such as invoking `liff.sendMessage()`.
 */
export const assertInClient = () => {
  if (DEBUG_LIFF) {
    return;
  }

  if (!liff.isInClient()) {
    alert(
      t`Sorry, the function is not applicable on desktop.` +
        '\n' +
        t`Please proceed on your mobile phone.` +
        ' 📲 '
    );
    liff.closeWindow();
  }
};

/**
 * Checks if still in the same search session.
 * This checks URL token for expiracy and try retrieving sessionId from GraphQL server.
 *
 * Closes LIFF when GraphQL server rejects.
 */
export const assertSameSearchSession = async () => {
  if (!urlToken) {
    alert(t`Cannot get token from URL`);
    liff.closeWindow();
    return;
  }

  const parsedToken = urlToken
    ? JSON.parse(atob(urlToken.split('.')[1]))
    : null;

  if ((parsedToken.exp || -Infinity) < Date.now() / 1000) {
    alert(t`Sorry, the button is expired.`);
    liff.closeWindow();
    return;
  }

  const { data, errors } = await gql`
    query CheckSessionId {
      context {
        data {
          sessionId
        }
      }
    }
  `();

  if (errors && errors[0].message === 'Invalid authentication header') {
    alert(t`This button was for previous search and is now expired.`);
    liff.closeWindow();
    return;
  }

  if (
    !data ||
    !data.context ||
    !data.context.data ||
    !data.context.data.sessionId
  ) {
    alert(
      /* t: In LIFF, should not happen */ t`Unexpected error, no search session data is retrieved.`
    );
    liff.closeWindow();
    return;
  }
};

/**
 * @param {string[]} articleIds
 * @returns {Article} Article object from Cofacts API
 */
export const getArticlesFromCofacts = async articleIds => {
  if (articleIds.length === 0) return [];

  const variables = articleIds.reduce((agg, articleId, idx) => {
    agg[`a${idx}`] = articleId;
    return agg;
  }, {});

  const variableKeys = Object.keys(variables);

  const query = `
    query GetArticlesLinkedToUser(
      ${variableKeys.map(k => `$${k}: String!`).join('\n')}
    ) {
      ${variableKeys
        .map(
          k =>
            `${k}: GetArticle(id: $${k}) {
              id
              text
              articleReplies(status: NORMAL) {
                createdAt
              }
            }`
        )
        .join('\n')}
    }
  `;

  let status;
  return fetch(COFACTS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-id': APP_ID,
    },
    body: JSON.stringify({ query, variables }),
  })
    .then(r => {
      status = r.status;
      return r.json();
    })
    .then(resp => {
      if (status === 400) {
        throw new Error(
          `getArticlesFromCofacts Error: ${resp.errors
            .map(({ message }) => message)
            .join('\n')}`
        );
      }
      if (resp.errors) {
        // When status is 200 but have error, just print them out.
        console.error(
          'getArticlesFromCofacts operation contains error:',
          resp.errors
        );
        rollbar.error(
          'getArticlesFromCofacts error',
          { body: JSON.stringify({ query, variables }) },
          { resp }
        );
      }
      return variableKeys.map(key => resp.data[key]);
    });
};

/**
 * @param {Object} messages
 */
export const sendMessages = async messages => {
  try {
    await liff.sendMessages(messages);
  } catch (e) {
    if (e.code == 403) {
      alert(
        t`Please retry and allow the permission 'send messages to chats', so that you can interact with chatbot while clicking the buttons.`
      );
    } else {
      alert(e);
      throw e;
    }
  }
};

/** Sanitize HTML tags */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

const urlRegExp = /(https?:\/\/\S+)/;

/**
 *
 * @param {string} str
 * @param {string} propStr
 * @returns {string} HTML string that wraps `str`'s URL with <a> tag with additional props in propStr
 */
export function linkify(str, propStr = '') {
  const tokenized = str.split(urlRegExp).map(s => {
    if (!s.match(urlRegExp)) return escapeHtml(s);

    // Perform URI encode only when necessary (containing " will break HTML string)
    const sanitizedUrl = s.includes('"') ? encodeURI(s) : s;
    return `<a href="${sanitizedUrl}" ${propStr}>${escapeHtml(
      decodeURIComponent(s)
    )}</a>`;
  });
  return tokenized.join('');
}
