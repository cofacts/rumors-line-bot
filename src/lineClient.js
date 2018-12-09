import fetch from 'node-fetch';
import rollbar from './rollbar';

export default async function lineClient(
  endpoint = '',
  body = {},
  options = {}
) {
  const URL = `https://api.line.me/v2/bot${endpoint}`;
  const resp = await fetch(URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      ...options.headers,
    },
    ...options,
    body: JSON.stringify(body),
  });

  const result = await resp.json();

  if (resp.status !== 200) {
    console.error(JSON.stringify(result, null, '  '));

    rollbar.error(
      `[LINE Client] ${resp.status}: ${result.message}.`,
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
