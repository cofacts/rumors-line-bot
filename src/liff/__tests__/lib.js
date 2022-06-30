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
            a0: GetArticle(id: $a0) {
                    id
                    text
                    articleReplies(status: NORMAL) {
                      createdAt
                    }
                  }
      a1: GetArticle(id: $a1) {
                    id
                    text
                    articleReplies(status: NORMAL) {
                      createdAt
                    }
                  }
      a2: GetArticle(id: $a2) {
                    id
                    text
                    articleReplies(status: NORMAL) {
                      createdAt
                    }
                  }
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

describe('sendMessages', () => {
  let lib;
  beforeEach(() => {
    global.location = { search: '' };
    global.alert = jest.fn();

    jest.resetModules();
    lib = require('../lib');
  });

  afterEach(() => {
    delete global.location;
    delete global.alert;
    delete global.liff;
  });

  it('sendMessages', async () => {
    global.liff = {
      sendMessages: jest.fn().mockImplementationOnce(() =>
        Promise.resolve({
          code: 200,
          message: `ok`,
        })
      ),
    };
    await expect(lib.sendMessages('send message')).resolves.toBe(undefined);
    expect(alert).not.toHaveBeenCalled();
    expect(liff.sendMessages).toHaveBeenCalledTimes(1);
  });

  it('handle 403 error', async () => {
    global.liff = {
      sendMessages: jest.fn().mockImplementationOnce(() => {
        const error = new Error(`user doesn't grant required permissions yet`);
        error.code = 403;
        throw error;
      }),
    };
    await expect(
      lib.sendMessages('send message without permissions')
    ).resolves.toBe(undefined);
    expect(liff.sendMessages).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Please retry and allow the permission 'send messages to chats', so that you can interact with chatbot while clicking the buttons.",
        ],
      ]
    `);
  });

  it('handle other errors', async () => {
    global.liff = {
      sendMessages: jest.fn().mockImplementationOnce(() => {
        const error = new Error(`unknown error`);
        error.code = 400;
        throw error;
      }),
    };
    await expect(
      lib.sendMessages('send message unknown error')
    ).rejects.toThrow();
    expect(liff.sendMessages).toHaveBeenCalledTimes(1);
    expect(alert.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          [Error: unknown error],
        ],
      ]
    `);
  });
});

describe('linkify', () => {
  let linkify;
  beforeAll(() => {
    global.location = { search: '' };
    linkify = require('../lib').linkify;
  });

  afterAll(() => {
    delete global.location;
  });

  it('handles empty string', () => {
    expect(linkify('')).toEqual('');
  });

  it('handles strings without URL and escapes HTML', () => {
    expect(
      linkify(`Foo & bar
      <script>evil script</script>`)
    ).toMatchInlineSnapshot(`
      "Foo &amp; bar
            &lt;script&gt;evil script&lt;/script&gt;"
    `);
  });

  it('converts URLs in string into HTML tags', () => {
    expect(
      linkify(`Reference1
        https://reference1.com?encoded=%E4%B8%AD%E6%96%87

        Reference2
        https://reference2.com/aaa?id=aaa&bbb=bbb+ccc&c="foo"`)
    ).toMatchInlineSnapshot(`
      "Reference1
              <a href=\\"https://reference1.com?encoded=%E4%B8%AD%E6%96%87\\" >https://reference1.com?encoded=中文</a>

              Reference2
              <a href=\\"https://reference2.com/aaa?id=aaa&bbb=bbb+ccc&c=%22foo%22\\" >https://reference2.com/aaa?id=aaa&amp;bbb=bbb+ccc&amp;c=\\"foo\\"</a>"
    `);
  });
});
