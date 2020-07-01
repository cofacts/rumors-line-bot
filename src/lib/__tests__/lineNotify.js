jest.mock('node-fetch');
jest.mock('src/lib/rollbar');

import fetch from 'node-fetch';
import rollbar from 'src/lib/rollbar';
import lineNotify from '../lineNotify';

beforeEach(() => {
  fetch.mockClear();
  rollbar.error.mockClear();
});

it('notify', async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      json: () => {},
    })
  );

  const token = `eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs`;
  const result = await lineNotify(token, { message: 'message' });
  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://notify-api.line.me/api/notify",
        Object {
          "body": "message=message",
          "headers": Object {
            "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          "method": "POST",
        },
      ],
    ]
  `);

  expect(result).toMatchInlineSnapshot(`undefined`);
});

it('handles runtime error', async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      status: 400,
      json: () =>
        Promise.resolve({
          data: null,
          errors: [
            {
              message: {
                error: 'invalid_request',
                error_description: 'Invalid IdToken.',
              },
            },
          ],
        }),
    })
  );

  const token = `invalidToken`;
  const result = await lineNotify(token, { message: 'message' });

  expect(result).toMatchInlineSnapshot(`
          Object {
            "data": null,
            "errors": Array [
              Object {
                "message": Object {
                  "error": "invalid_request",
                  "error_description": "Invalid IdToken.",
                },
              },
            ],
          }
      `);
  expect(rollbar.error.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "[LINE notify] 400: undefined.",
        Object {
          "body": "{\\"message\\":\\"message\\"}",
          "headers": undefined,
          "method": "POST",
          "url": "https://notify-api.line.me/api/notify",
        },
        Object {
          "result": Object {
            "data": null,
            "errors": Array [
              Object {
                "message": Object {
                  "error": "invalid_request",
                  "error_description": "Invalid IdToken.",
                },
              },
            ],
          },
        },
      ],
    ]
  `);
});
