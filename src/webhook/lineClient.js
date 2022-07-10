import fetch from 'node-fetch';
import rollbar from 'src/lib/rollbar';

export default { post, get, getContent };

async function post(endpoint = '', body = {}, options = {}) {
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

async function get(endpoint = '', options = {}) {
  const URL = `https://api.line.me/v2/bot${endpoint}`;
  const resp = await fetch(URL, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      ...options.headers,
    },
    ...options,
  });

  const result = await resp.json();

  if (resp.status !== 200) {
    console.error(JSON.stringify(result, null, '  '));

    rollbar.error(
      `[LINE Client] ${resp.status}: ${result.message}.`,
      {
        // Request object for rollbar server SDK
        headers: options.headers,
        url: URL,
        method: 'GET',
      },
      { result }
    );
  }

  return result;
}

async function getContent(messageId, options = {}) {
  // this endpoint is for sending and receiving large amounts of data in the LINE platform for Messaging API.
  // https://developers.line.biz/en/reference/messaging-api/#get-content
  const URL = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const resp = await fetch(URL, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
      ...options.headers,
    },
    ...options,
  });

  if (resp.status !== 200) {
    const err = await resp.json();
    console.error(JSON.stringify(err, null, '  '));

    rollbar.error(
      `[LINE Client] ${resp.status}: ${err.message}.`,
      {
        // Request object for rollbar server SDK
        headers: options.headers,
        url: URL,
        method: 'GET',
      },
      { result: err }
    );
  }

  return resp;
}
