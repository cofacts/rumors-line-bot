/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "\n    query ListArticlesInInitState($text: String!) {\n      ListArticles(\n        filter: { moreLikeThis: { like: $text } }\n        orderBy: [{ _score: DESC }]\n        first: 4\n      ) {\n        edges {\n          node {\n            text\n            id\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  ": types.ListArticlesInInitStateDocument,
    "fragment CreateReferenceWordsReply on Reply {\n  reference\n  type\n}\n\nfragment CreateReplyMessagesReply on Reply {\n  text\n  ...CreateReferenceWordsReply\n}\n\nfragment CreateReplyMessagesArticle on Article {\n  replyCount\n}\n\nfragment CreateHighlightContentsHighlight on Highlights {\n  text\n  hyperlinks {\n    title\n    summary\n  }\n}": types.CreateReferenceWordsReplyFragmentDoc,
    "\n      mutation CreateAIReply($articleId: String!) {\n        CreateAIReply(articleId: $articleId) {\n          text\n        }\n      }\n    ": types.CreateAiReplyDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ListArticlesInInitState($text: String!) {\n      ListArticles(\n        filter: { moreLikeThis: { like: $text } }\n        orderBy: [{ _score: DESC }]\n        first: 4\n      ) {\n        edges {\n          node {\n            text\n            id\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    query ListArticlesInInitState($text: String!) {\n      ListArticles(\n        filter: { moreLikeThis: { like: $text } }\n        orderBy: [{ _score: DESC }]\n        first: 4\n      ) {\n        edges {\n          node {\n            text\n            id\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment CreateReferenceWordsReply on Reply {\n  reference\n  type\n}\n\nfragment CreateReplyMessagesReply on Reply {\n  text\n  ...CreateReferenceWordsReply\n}\n\nfragment CreateReplyMessagesArticle on Article {\n  replyCount\n}\n\nfragment CreateHighlightContentsHighlight on Highlights {\n  text\n  hyperlinks {\n    title\n    summary\n  }\n}"): (typeof documents)["fragment CreateReferenceWordsReply on Reply {\n  reference\n  type\n}\n\nfragment CreateReplyMessagesReply on Reply {\n  text\n  ...CreateReferenceWordsReply\n}\n\nfragment CreateReplyMessagesArticle on Article {\n  replyCount\n}\n\nfragment CreateHighlightContentsHighlight on Highlights {\n  text\n  hyperlinks {\n    title\n    summary\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation CreateAIReply($articleId: String!) {\n        CreateAIReply(articleId: $articleId) {\n          text\n        }\n      }\n    "): (typeof documents)["\n      mutation CreateAIReply($articleId: String!) {\n        CreateAIReply(articleId: $articleId) {\n          text\n        }\n      }\n    "];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;