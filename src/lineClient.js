import fetch from 'node-fetch';
import rollbar from 'rollbar';
import botimize from 'botimize';

export default async function lineClient(
  endpoint = '',
  body = {},
  options = {}
) {
  let dataToLog = {
    ...body,
    channelAccessToken: process.env.LINE_CHANNEL_TOKEN,
  };
  if (process.env.BOTIMIZE_API_KEY) {
    const botimizeLogger = botimize(process.env.BOTIMIZE_API_KEY, 'line');
    botimizeLogger.logOutgoing(dataToLog, { parse: 'pure' });
  }
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
    const error = new Error(`[LINE Client] ${resp.status}: ${result.message}.`);
    rollbar.handleErrorWithPayloadData(error, { custom: result });
  }

  return result;
}
