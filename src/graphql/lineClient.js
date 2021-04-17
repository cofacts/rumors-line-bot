import fetch from 'node-fetch';
import querystring from 'querystring';
import rollbar from 'src/lib/rollbar';

/**
 * Reference: https://developers.line.biz/en/reference/social-api/#response-5
 *
 * TODO: use signature to perform offline test instead, remove the need to call endpoint
 * https://developers.line.biz/en/docs/line-login/integrate-line-login/#decode-and-validate-id-token
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
      client_id: process.env.LINE_LOGIN_CHANNEL_ID,
    }),
  });

  const result = await resp.json();

  if (resp.status !== 200) {
    rollbar.error(`[verifyIDToken] ${resp.status}: ${result.message}.`, {
      result,
    });
  }

  return result;
}

/**
 * Reference: https://notify-bot.line.me/doc/en/
 *
 * @param {string} lineNotifyToken
 */
export async function revokeNotifyToken(lineNotifyToken) {
  const URL = 'https://notify-api.line.me/api/revoke';
  const resp = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${lineNotifyToken}`,
    },
  });
  const result = await resp.json();

  if (resp.status !== 200) {
    rollbar.error(`[revokeNotifyToken] ${resp.status}: ${result.message}.`, {
      result,
    });
  }

  return result;
}
