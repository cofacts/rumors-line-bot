import fetch from 'node-fetch';

export default async function lineClient(endpoint = '', body = {}, options = {}) {
  const resp = await fetch(`https://api.line.me/v2/bot${endpoint}`, {
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
    throw new Error(`${resp.status}: ${result.message}`);
  }

  return result;
}
