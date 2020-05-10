import fetch from 'node-fetch';
import querystring from 'querystring';
import rollbar from 'src/lib/rollbar';

/**
 * Reference: https://developers.line.biz/en/reference/social-api/#response-5
 *
 * @param {string} idToken
 * @return {object} Response from API
 */
export async function verifyIDToken(idToken) {
  const URL = 'https://api.line.me/oauth2/v2.1/verify';
  const resp = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: querystring.stringify({
      id_token: idToken,
      client_id: process.env.LINE_CHANNEL_ID,
    }),
  });

  const result = await resp.json();

  if (resp.status !== 200) {
    console.error(JSON.stringify(result, null, '  '));

    rollbar.error(`[verifyIDToken] ${resp.status}: ${result.message}.`, {
      result,
    });
  }

  return result;
}
