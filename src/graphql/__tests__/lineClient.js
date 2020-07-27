jest.mock('node-fetch');
jest.mock('src/lib/rollbar');

import fetch from 'node-fetch';
import rollbar from 'src/lib/rollbar';
import { verifyIDToken, revokeNotifyToken } from '../lineClient';

beforeEach(() => {
  fetch.mockClear();
  rollbar.error.mockClear();
});
describe('verifyIDToken', () => {
  it('verifies IDToken', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            iss: 'https://access.line.me',
            sub: 'U3a749b9bdda7fa43daa746394400e3ac',
            aud: 1654258834,
            exp: 1591514952,
            iat: 1591511352,
            amr: ['linesso'],
          }),
      })
    );

    const token = `eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs`;
    const result = await verifyIDToken(token);
    expect(fetch.mock.calls).toMatchInlineSnapshot(`
          Array [
            Array [
              "https://api.line.me/oauth2/v2.1/verify",
              Object {
                "body": "id_token=eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs&client_id=",
                "headers": Object {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
                "method": "POST",
              },
            ],
          ]
      `);

    expect(result).toMatchInlineSnapshot(`
          Object {
            "amr": Array [
              "linesso",
            ],
            "aud": 1654258834,
            "exp": 1591514952,
            "iat": 1591511352,
            "iss": "https://access.line.me",
            "sub": "U3a749b9bdda7fa43daa746394400e3ac",
          }
      `);
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
    const result = await verifyIDToken(token);

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
              "[verifyIDToken] 400: undefined.",
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
});

describe('revokeNotifyToken', () => {
  it('revokes LINE Notify token', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            data: 'ok',
          }),
      })
    );

    const token = `eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs`;
    const result = await revokeNotifyToken(token);
    expect(fetch.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "https://notify-api.line.me/api/revoke",
          Object {
            "headers": Object {
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJmb28iOiJiYXIifQ.oB-hPP-iM8gpHyhhTnltlh9Ph8WdapCcPRZ2zJ_AwBs",
              "Content-Type": "application/x-www-form-urlencoded",
            },
            "method": "POST",
          },
        ],
      ]
    `);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": "ok",
      }
    `);
  });

  it('handles runtime error', async () => {
    fetch.mockImplementationOnce(() =>
      Promise.resolve({
        status: 401,
        json: () =>
          Promise.resolve({
            data: null,
            errors: [
              {
                message: {
                  error: 'Invalid access token',
                },
              },
            ],
          }),
      })
    );
    const token = `invalidToken`;
    const result = await revokeNotifyToken(token);

    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": null,
        "errors": Array [
          Object {
            "message": Object {
              "error": "Invalid access token",
            },
          },
        ],
      }
    `);
    expect(rollbar.error.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "[revokeNotifyToken] 401: undefined.",
          Object {
            "result": Object {
              "data": null,
              "errors": Array [
                Object {
                  "message": Object {
                    "error": "Invalid access token",
                  },
                },
              ],
            },
          },
        ],
      ]
    `);
  });
});
