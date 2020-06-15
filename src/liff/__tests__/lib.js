beforeEach(() => {
  // We are changing global.location and other global variables very frequently in this file,
  // thus we reset require before each unit test.
  //
  jest.resetModules();
});

it('isDuringLiffRedirect reacts to URL search string', () => {
  global.location = {
    search: '?liff.state=foo',
  };
  let lib = require('../lib');
  expect(lib.isDuringLiffRedirect).toBe(true);
  jest.resetModules();

  global.location = {
    search: '?foo=bar',
  };
  lib = require('../lib');
  expect(lib.isDuringLiffRedirect).toBe(false);
});

describe('gql', () => {
  afterEach(() => {
    delete global.location;
    delete global.fetch;
    delete global.rollbar;
    delete global.liff;
  });

  it('throws when no token provided', async () => {
    global.location = { search: '?' }; // empty url token
    global.liff = { getIDToken: jest.fn() }; // No id token

    const { gql } = require('../lib');
    await expect(gql`query`()).rejects.toMatchInlineSnapshot(
      `"gql Error: token not set."`
    );
    expect(liff.getIDToken).toHaveBeenCalledTimes(1);
  });

  it('throws on GraphQL query error', async () => {
    global.location = { search: '?' }; // empty url token
    global.liff = { getIDToken: () => 'id-token' }; // Has id token
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 400,
        json: () =>
          Promise.resolve({
            errors: [{ message: 'some query syntax error' }],
          }),
      })
    );

    const { gql } = require('../lib');
    await expect(gql`query`()).rejects.toMatchInlineSnapshot(
      `[Error: GraphQL Error: some query syntax error]`
    );
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('emits runtime error to Rollbar and return partial data on GraphQL runtime error', async () => {
    global.location = { search: '?' }; // empty url token
    global.liff = { getIDToken: () => 'id-token' }; // Has id token
    global.rollbar = { error: jest.fn() };
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            data: 'partial-data',
            errors: [{ message: 'some execution error' }],
          }),
      })
    );

    const { gql } = require('../lib');
    await expect(gql`query`()).resolves.toMatchInlineSnapshot(`
            Object {
              "data": "partial-data",
              "errors": Array [
                Object {
                  "message": "some execution error",
                },
              ],
            }
          `);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(rollbar.error).toHaveBeenCalledTimes(1);
  });

  it('returns GraphQL result', async () => {
    global.location = { search: '?token=foo' }; // has url token
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        status: 200,
        json: () =>
          Promise.resolve({
            data: 'bar',
          }),
      })
    );

    const { gql } = require('../lib');
    await expect(gql`query`({ variables: { foobar: 123 } })).resolves
      .toMatchInlineSnapshot(`
            Object {
              "data": "bar",
            }
          `);
    expect(fetch.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "/graphql",
          Object {
            "body": "{\\"query\\":\\"query\\",\\"variables\\":{\\"variables\\":{\\"foobar\\":123}}}",
            "headers": Object {
              "Authorization": "Bearer foo",
              "Content-Type": "application/json",
            },
            "method": "POST",
          },
        ],
      ]
    `);
  });
});

describe('assertInClient', () => {
  beforeEach(() => {
    global.location = { search: '' };
  });

  afterEach(() => {
    delete global.DEBUG_LIFF;
    delete global.alert;
    delete global.liff;
    delete global.location;
  });

  it('DEBUG_LIFF works', () => {
    global.liff = {
      isInClient: jest.fn(),
    };
    global.DEBUG_LIFF = true;

    const { assertInClient } = require('../lib');
    expect(assertInClient()).toBe(undefined);
    expect(liff.isInClient).not.toHaveBeenCalled();
  });

  it('does nothing if in client', () => {
    global.liff = {
      isInClient: jest.fn().mockImplementation(() => true),
      closeWindow: jest.fn(),
    };
    global.DEBUG_LIFF = undefined;

    const { assertInClient } = require('../lib');
    expect(assertInClient()).toBe(undefined);
    expect(liff.isInClient).toHaveBeenCalledTimes(1);
    expect(liff.closeWindow).not.toHaveBeenCalled();
  });

  it('alerts and closes window if not in client', () => {
    global.liff = {
      isInClient: jest.fn().mockImplementation(() => false),
      closeWindow: jest.fn(),
    };
    global.alert = jest.fn();
    global.DEBUG_LIFF = undefined;

    const { assertInClient } = require('../lib');
    expect(assertInClient()).toBe(undefined);
    expect(liff.isInClient).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Sorry, the function is not applicable on desktop.
      Please proceed on your mobile phone. 📲 ",
        ],
      ]
    `);
    expect(liff.closeWindow).toHaveBeenCalledTimes(1);
  });
});

describe('assertSameSearchSession', () => {
  afterEach(() => {
    delete global.location;
    delete global.alert;
    delete global.liff;
    delete global.atob;
    delete global.fetch;
    delete global.rollbar;
  });

  it('closes window if no token given in URL', async () => {
    global.location = {
      search: '', // No token
    };
    global.liff = { closeWindow: jest.fn() };
    global.alert = jest.fn();

    const { assertSameSearchSession } = require('../lib');
    await expect(assertSameSearchSession()).resolves.toBe(undefined);
    expect(alert.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Cannot get token from URL",
        ],
      ]
    `);
    expect(liff.closeWindow).toHaveBeenCalledTimes(1);
  });

  it('closes window if URL token is expired', async () => {
    global.location = {
      search: `?token=foo.bar`, // Has token
    };
    global.liff = { closeWindow: jest.fn() };
    global.alert = jest.fn();
    global.atob = () => JSON.stringify({ exp: Date.now() / 1000 - 10 }); // return expired time

    const { assertSameSearchSession } = require('../lib');
    await expect(assertSameSearchSession()).resolves.toBe(undefined);

    expect(alert.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Sorry, the button is expired.",
        ],
      ]
    `);
    expect(liff.closeWindow).toHaveBeenCalledTimes(1);
  });

  it('closes window if graphql call errors with invalid auth header', async () => {
    global.location = {
      search: `?token=foo.bar`, // Has token
    };
    global.liff = { closeWindow: jest.fn() };
    global.alert = jest.fn();
    global.atob = () => JSON.stringify({ exp: Date.now() / 1000 + 10 }); // not-expired time
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: null,
            errors: [{ message: 'Invalid authentication header' }],
          }),
      })
    );
    global.rollbar = { error: jest.fn() };

    const { assertSameSearchSession } = require('../lib');
    await expect(assertSameSearchSession()).resolves.toBe(undefined);
    expect(fetch.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "/graphql",
          Object {
            "body": "{\\"query\\":\\"\\\\n    query CheckSessionId {\\\\n      context {\\\\n        data {\\\\n          sessionId\\\\n        }\\\\n      }\\\\n    }\\\\n  \\"}",
            "headers": Object {
              "Authorization": "Bearer foo.bar",
              "Content-Type": "application/json",
            },
            "method": "POST",
          },
        ],
      ]
    `);
    expect(alert.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "This button was for previous search and is now expired.",
        ],
      ]
    `);
    expect(liff.closeWindow).toHaveBeenCalledTimes(1);
  });

  it('handles unexpected weird error, where no context data is retrieved', async () => {
    global.location = {
      search: `?token=foo.bar`, // Has token
    };
    global.liff = { closeWindow: jest.fn() };
    global.alert = jest.fn();
    global.atob = () => JSON.stringify({ exp: Date.now() / 1000 + 10 }); // not-expired time

    const { assertSameSearchSession } = require('../lib');

    // All variations of incorrect GraphQL response
    const incorrectFetchedData = [
      { data: null },
      { data: { context: null } },
      { data: { context: { data: null } } },
      { data: { context: { data: { sessionId: null } } } },
    ];

    for (const fetchedData of incorrectFetchedData) {
      alert.mockClear();
      liff.closeWindow.mockClear();

      global.fetch = jest.fn().mockImplementation(() =>
        Promise.resolve({
          json: () => Promise.resolve(fetchedData),
        })
      );

      await expect(assertSameSearchSession()).resolves.toBe(undefined);

      expect(alert.mock.calls[0][0]).toBe(
        'Unexpected error, no search session data is retrieved.'
      );
      expect(liff.closeWindow).toHaveBeenCalledTimes(1);
    }
  });

  it('does nothing when all pass', async () => {
    global.location = {
      search: `?token=foo.bar`, // Has token
    };
    global.liff = { closeWindow: jest.fn() };
    global.atob = () => JSON.stringify({ exp: Date.now() / 1000 + 10 }); // not-expired time

    const { assertSameSearchSession } = require('../lib');

    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve({
            data: {
              context: {
                data: {
                  sessionId: 'foo',
                },
              },
            },
          }),
      })
    );

    await expect(assertSameSearchSession()).resolves.toBe(undefined);
    expect(liff.closeWindow).toHaveBeenCalledTimes(0);
  });
});

describe('getArticlesFromCofacts', () => {
  let getArticlesFromCofacts;
  beforeEach(() => {
    global.location = { search: '?foo=bar' };
    global.COFACTS_API_URL = 'http://cofacts.api';
    global.APP_ID = 'mock_app_id';
    global.fetch = jest.fn();
    global.rollbar = { error: jest.fn() };

    jest.resetModules();
    getArticlesFromCofacts = require('../lib').getArticlesFromCofacts;
  });

  afterEach(() => {
    delete global.COFACTS_API_URL;
    delete global.fetch;
    delete global.APP_ID;
    delete global.location;
    delete global.rollbar;
  });

  it('handles empty', async () => {
    await expect(getArticlesFromCofacts([])).resolves.toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects on GraphQL error', async () => {
    fetch.mockReturnValueOnce(
      Promise.resolve({
        status: 400,
        json: jest.fn().mockReturnValueOnce(
          Promise.resolve({
            errors: [{ message: 'fake error' }],
          })
        ),
      })
    );

    await expect(getArticlesFromCofacts(['id1'])).rejects.toMatchInlineSnapshot(
      `[Error: getArticlesFromCofacts Error: fake error]`
    );
  });

  it('converts article ids to GraphQL request and returns result, despite minor errors', async () => {
    const ids = ['id1', 'id2', 'id3'];
    fetch.mockReturnValueOnce(
      Promise.resolve({
        status: 200,
        json: jest.fn().mockReturnValueOnce(
          Promise.resolve({
            data: {
              a0: {
                id: 'id1',
                text: 'text1',
              },
              a1: {
                id: 'id2',
                text: 'text2',
              },
            },
            errors: [{ message: 'Some error loading id3' }],
          })
        ),
      })
    );

    await expect(getArticlesFromCofacts(ids)).resolves.toMatchInlineSnapshot(`
      Array [
        Object {
          "id": "id1",
          "text": "text1",
        },
        Object {
          "id": "id2",
          "text": "text2",
        },
        undefined,
      ]
    `);

    expect(rollbar.error).toHaveBeenCalledTimes(1);

    // Check sent GraphQL query & variables
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchInlineSnapshot(`
      Object {
        "query": "
          query GetArticlesLinkedToUser(
            $a0: String!
      $a1: String!
      $a2: String!
          ) {
            a0: GetArticle(id: $a0) { text }
      a1: GetArticle(id: $a1) { text }
      a2: GetArticle(id: $a2) { text }
          }
        ",
        "variables": Object {
          "a0": "id1",
          "a1": "id2",
          "a2": "id3",
        },
      }
    `);
  });
});
