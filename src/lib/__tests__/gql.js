jest.mock("node-fetch");
jest.mock("../rollbar");

import fetch from "node-fetch";
import rollbar from "../rollbar";
import gql from "../gql";

beforeEach(() => {
  fetch.mockClear();
  rollbar.error.mockClear();
});

it("invokes fetch and returns result", async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({ json: () => Promise.resolve({ data: { foo: 1 } }) })
  );
  const result = await gql`(bar: String){foo}`({ bar: "bar" });

  expect(fetch.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "https://cofacts-api.hacktabl.org/graphql",
        Object {
          "body": "{\\"query\\":\\"(bar: String){foo}\\",\\"variables\\":{\\"bar\\":\\"bar\\"}}",
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

it("handles syntax error", async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      status: 400,
      json: () =>
        Promise.resolve({ data: null, errors: [{ message: "Syntax error" }] })
    })
  );
  const result = await gql`
    {
      foo
    }
  `().catch(err => err);

  expect(result).toMatchInlineSnapshot(`[Error: GraphQL Error: Syntax error]`);
});

it("handles runtime error", async () => {
  fetch.mockImplementationOnce(() =>
    Promise.resolve({
      status: 200,
      json: () =>
        Promise.resolve({ data: null, errors: [{ message: "Runtime error" }] })
    })
  );
  const result = await gql`
    {
      foo
    }
  `();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": null,
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
          "url": "https://cofacts-api.hacktabl.org/graphql",
        },
        Object {
          "resp": Object {
            "data": null,
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
