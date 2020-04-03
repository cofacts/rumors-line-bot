import { gql } from '../testUtils';

describe('hello', () => {
  it('works', async () => {
    const result = await gql`
      {
        hello
      }
    `();
    expect(result).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "hello": "world",
        },
      }
    `);
  });
});
