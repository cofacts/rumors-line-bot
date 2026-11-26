const mockResultQueue: object[] = [];

type MockCall = { query: string; variables?: object; options?: object };
const mockCalls: MockCall[] = [];

function gqlMock(strings: TemplateStringsArray | string[] = []) {
  const query = Array.from(strings).join('');
  return (variables?: object, options?: object) => {
    mockCalls.push({ query, variables, options });
    const ret = mockResultQueue.shift();
    return Promise.resolve(ret);
  };
}

/**
 * @returns the query, variables and options of each gql()() call since the last __reset()
 */
gqlMock.__calls = function () {
  return mockCalls;
};

/**
 * Enqueues mock data what will be returned in next gql()() call.
 *
 * Once gql()() is invoked, the first data in queue will be consumed.
 *
 * @param {*} returnValue the mock value that gql()()'s returned promise will resolve to.
 * @returns nothing
 */
gqlMock.__push = function (returnValue: object) {
  mockResultQueue.push(returnValue);
};

/**
 * Empty the return data queue.
 *
 * Invoking this in afterEach() will ensure 1 failed test would not leave side effects to other
 * tests.
 */
gqlMock.__reset = function () {
  mockResultQueue.length = 0;
  mockCalls.length = 0;
};

/**
 * @returns {Boolean} if the mock response has been depleted
 */
gqlMock.__finished = function () {
  return mockResultQueue.length === 0;
};

export default gqlMock;
export type MockedGql = typeof gqlMock;
