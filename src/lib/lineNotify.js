import querystring from 'querystring';
import fetch from 'node-fetch';
import rollbar from 'src/lib/rollbar';

// https://notify-bot.line.me/doc/en/
export default async function(token, body = {}, options = {}) {
  const URL = `https://notify-api.line.me/api/notify`;
  const resp = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
    body: querystring.stringify(body),
  });

  const result = await resp.json();

  if (resp.status !== 200) {
    // console.error(JSON.stringify(result, null, '  '));

    rollbar.error(
      `[LINE notify] ${resp.status}: ${result.message}.`,
      {
        // Request object for rollbar server SDK
        headers: options.headers,
        body: JSON.stringify(body),
        url: URL,
        method: 'POST',
      },
      { result }
    );
  }

  return result;
}
