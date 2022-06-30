jest.mock('node-fetch');
jest.mock('../rollbar');

import fetch from 'node-fetch';
import rollbar from '../rollbar';
import gql, { loaders } from '../gql';

beforeEach(() => {
  fetch.mockClear();
  rollbar.error.mockClear();
});

it('invokes fetch and returns result', async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({ json: () => Promise.resolve([{ data: { foo: 1 } }]) })
  );
  const result = await gql`(bar: String){foo}`({ bar: 'bar' });

  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://dev-api.cofacts.tw/graphql",
        Object {
          "body": "[{\\"query\\":\\"(bar: String){foo}\\",\\"variables\\":{\\"bar\\":\\"bar\\"}}]",
          "credentials": "include",
          "headers": Object {
            "Content-Type": "application/json",
            "x-app-secret": "CHANGE_ME",
          },
          "method": "POST",
        },
      ],
    ]
  `);

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "foo": 1,
      },
    }
  `);
});

it('handles syntax error', async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200, // Apollo Server always return 200 when transport layer batch is used.
      json: () =>
        Promise.resolve([
          // Apollo Server do not send `data` when there is syntax error
          { errors: [{ message: 'Syntax error' }] },
        ]),
    })
  );
  const result = await gql`
    {
      foo
    }
  `().catch(err => err);

  expect(result).toMatchInlineSnapshot(`[Error: GraphQL Error: Syntax error]`);
});

it('handles runtime error', async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      json: () =>
        Promise.resolve([
          // No fields resolved successfully, but data is still an object
          { data: {}, errors: [{ message: 'Runtime error' }] },
        ]),
    })
  );
  const result = await gql`
    {
      foo
    }
  `();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {},
      "errors": Array [
        Object {
          "message": "Runtime error",
        },
      ],
    }
  `);
  expect(rollbar.error.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "GraphQL error",
        Object {
          "body": "{\\"query\\":\\"\\\\n    {\\\\n      foo\\\\n    }\\\\n  \\"}",
          "url": "https://dev-api.cofacts.tw/graphql",
        },
        Object {
          "resp": Object {
            "data": Object {},
            "errors": Array [
              Object {
                "message": "Runtime error",
              },
            ],
          },
        },
      ],
    ]
  `);
});

it('batches consecutive requests by URL', async () => {
  fetch
    .mockImplementationOnce(() =>
      Promise.resolve({
        json: () =>
          Promise.resolve([{ data: { foo: 1 } }, { data: { bar: 2 } }]),
      })
    )
    .mockImplementationOnce(() =>
      Promise.resolve({
        json: () => Promise.resolve([{ data: { foobar: 3 } }]),
      })
    );

  const results = await Promise.all([
    gql`
      {
        foo
      }
    `(),
    gql`
      {
        bar
      }
    `(),
    gql`
      {
        foobar
      }
    `({}, { userId: 'another-user' }),
  ]);

  // Expect called 2 times
  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://dev-api.cofacts.tw/graphql",
        Object {
          "body": "[{\\"query\\":\\"\\\\n      {\\\\n        foo\\\\n      }\\\\n    \\"},{\\"query\\":\\"\\\\n      {\\\\n        bar\\\\n      }\\\\n    \\"}]",
          "credentials": "include",
          "headers": Object {
            "Content-Type": "application/json",
            "x-app-secret": "CHANGE_ME",
          },
          "method": "POST",
        },
      ],
      Array [
        "https://dev-api.cofacts.tw/graphql?userId=another-user",
        Object {
          "body": "[{\\"query\\":\\"\\\\n      {\\\\n        foobar\\\\n      }\\\\n    \\",\\"variables\\":{}}]",
          "credentials": "include",
          "headers": Object {
            "Content-Type": "application/json",
            "x-app-secret": "CHANGE_ME",
          },
          "method": "POST",
        },
      ],
    ]
  `);

  // Expect foo, bar and foobar all returned
  expect(results).toMatchInlineSnapshot(`
    Array [
      Object {
        "data": Object {
          "foo": 1,
        },
      },
      Object {
        "data": Object {
          "bar": 2,
        },
      },
      Object {
        "data": Object {
          "foobar": 3,
        },
      },
    ]
  `);

  // Expect loaders to be empty
  expect(loaders).toMatchInlineSnapshot(`Object {}`);
});
