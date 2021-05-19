jest.mock('node-fetch');
jest.mock('src/lib/rollbar');

import fetch from 'node-fetch';
import rollbar from 'src/lib/rollbar';
import sendMessage from '../sendMessage';

beforeEach(() => {
  fetch.mockReset();
  rollbar.error.mockClear();
});

it('send message using LINE Notify', () => {
  sendMessage.notify('line_notify_token', 'message');
  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://notify-api.line.me/api/notify",
        Object {
          "body": "message=message",
          "headers": Object {
            "Authorization": "Bearer line_notify_token",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          "method": "POST",
        },
      ],
    ]
  `);
});

it('send message using multicast api', async () => {
  fetch.mockImplementation(() =>
    Promise.resolve({ json: () => Promise.resolve({ status: 200 }) })
  );

  await sendMessage.multicast(
    ['userId1', 'userId2', 'userId3'],
    [{ type: 'text', text: 'message' }]
  );
  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://api.line.me/v2/bot/message/multicast",
        Object {
          "body": "{\\"to\\":[\\"userId1\\",\\"userId2\\",\\"userId3\\"],\\"messages\\":[{\\"type\\":\\"text\\",\\"text\\":\\"message\\"}]}",
          "headers": Object {
            "Authorization": "Bearer ",
            "Content-Type": "application/json",
          },
          "method": "POST",
        },
      ],
    ]
  `);

  // Test batching
  fetch.mockClear();
  await sendMessage.multicast(
    Array.from(Array(501)).map((_, id) => `user${id}`),
    [{ type: 'text', text: 'message' }]
  );

  expect(fetch.mock.calls).toHaveLength(2);

  // The snapshot of the "second batch", which should only contain user500
  expect(fetch.mock.calls[1]).toMatchInlineSnapshot(`
    Array [
      "https://api.line.me/v2/bot/message/multicast",
      Object {
        "body": "{\\"to\\":[\\"user500\\"],\\"messages\\":[{\\"type\\":\\"text\\",\\"text\\":\\"message\\"}]}",
        "headers": Object {
          "Authorization": "Bearer ",
          "Content-Type": "application/json",
        },
        "method": "POST",
      },
    ]
  `);
});

it('send message using push api', () => {
  sendMessage.push('userId1', [{ type: 'text', text: 'message' }]);
  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://api.line.me/v2/bot/message/push",
        Object {
          "body": "{\\"to\\":\\"userId1\\",\\"messages\\":[{\\"type\\":\\"text\\",\\"text\\":\\"message\\"}]}",
          "headers": Object {
            "Authorization": "Bearer ",
            "Content-Type": "application/json",
          },
          "method": "POST",
        },
      ],
    ]
  `);
});
