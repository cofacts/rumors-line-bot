jest.mock("node-fetch");

import fetch from "node-fetch";
import gql from "../gql";

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
