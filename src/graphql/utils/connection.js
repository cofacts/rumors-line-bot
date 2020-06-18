const DEFAULT_EDGE_COUNT = 25;

/**
 * Sets proper parent function for totalCount, edges and pageInfo.
 * Also sets functions Apollo server's default resolver to call.
 *
 * @param {Base!} model - instance of a model under database/models
 * @param {{before: Cursor, after: Cursor, first: number, orderBy: object, filter: object}} args - pagination arguments of GraphQL pagination.
 * @returns {Connection} resolved Connection type
 */
export async function processConnection(model, args) {
  // Normalization
  const normalizedArgs = {
    ...args,
    first: args.first || DEFAULT_EDGE_COUNT,
    filter: args.filter || {},
  };

  const _totalCount = await (await model.client).countDocuments(
    normalizedArgs.filter
  );

  // setup parent object for the field resolvers
  const parent = {
    model,
    args: normalizedArgs,
    _totalCount,
  };

  return {
    // functions for the default resolver.
    // Signature is (args, contextValue, info) => {}
    // Ref: https://github.com/graphql/graphql-js/blob/master/src/execution/execute.js#L1181-L1199
    //
    totalCount: resolveTotalCount.bind(null, parent),
    edges: resolveEdges.bind(null, parent),
    pageInfo: resolvePageInfo.bind(null, parent),
  };
}

/**
 * @param {Base!} model - instance of a model under database/models
 * @param {{before: Cursor, after: Cursor, first: number, orderBy: object}} args - pagination arguments of GraphQL pagination.
 * @returns {Connection}
 */
export async function resolveEdges({ model, args }) {
  let cursor = await (await model.client).find(args.filter);
  if (args.orderBy) {
    cursor = cursor.sort(args.orderBy);
  }

  let cursorBase = 0;
  let count = args.first;
  if (args.after !== undefined) {
    cursorBase = args.after + 1;
  } else if (args.before !== undefined) {
    // min(args.first, args.before) items prior to args.before
    count = Math.min(args.first, args.before);
    cursorBase = args.before - count;
  }
  cursor = cursor.skip(cursorBase).limit(count);

  return (await cursor.toArray()).map((doc, i) => ({
    node: { ...doc, id: doc._id },
    cursor: cursorBase + i,
  }));
}

/**
 * @param {object} parent parent object set by processConnection()
 * @returns {PageInfo}
 */
export function resolvePageInfo({ _totalCount }) {
  if (_totalCount > 0) {
    return {
      firstCursor: 0,
      lastCursor: _totalCount - 1,
    };
  }

  // No edges found, return null as cursors
  return {
    firstCursor: null,
    lastCursor: null,
  };
}

/**
 * Trivial totalCount resolver. Exported for easier override if needed.
 *
 * @param {object} parent parent object set by processConnection()
 * @returns {number} The total count of the query
 */
export function resolveTotalCount(...args) {
  const { _totalCount } = args[0];
  return _totalCount;
}
