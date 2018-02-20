const mockResultQueue = [];

function gqlMock() {
  return () => {
    const ret = mockResultQueue.shift();
    return Promise.resolve(ret);
  };
}

/**
 * Enqueues mock data what will be returned in next gql()() call.
 *
 * Once gql()() is invoked, the first data in queue will be consumed.
 *
 * @param {*} returnValue the mock value that gql()()'s returned promise will resolve to.
 * @returns nothing
 */
gqlMock.__push = function(returnValue) {
  mockResultQueue.push(returnValue);
};

/**
 * Empty the return data queue.
 *
 * Invoking this in afterEach() will ensure 1 failed test would not leave side effects to other
 * tests.
 */
gqlMock.__reset = function() {
  mockResultQueue.length = 0;
};

export default gqlMock;
