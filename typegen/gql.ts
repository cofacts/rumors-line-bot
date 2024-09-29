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
    "\n          mutation SubmitTextArticleUnderConsent($text: String!) {\n            CreateArticle(text: $text, reference: { type: LINE }) {\n              id\n            }\n          }\n        ": types.SubmitTextArticleUnderConsentDocument,
    "\n        mutation SubmitMediaArticleUnderConsent(\n          $mediaUrl: String!\n          $articleType: ArticleTypeEnum!\n        ) {\n          CreateMediaArticle(\n            mediaUrl: $mediaUrl\n            articleType: $articleType\n            reference: { type: LINE }\n          ) {\n            id\n          }\n        }\n      ": types.SubmitMediaArticleUnderConsentDocument,
    "\n    query GetArticleInChoosingArticle($id: String!) {\n      GetArticle(id: $id) {\n        text\n        replyCount\n        articleType\n        articleReplies(status: NORMAL) {\n          reply {\n            id\n            type\n            text\n          }\n          positiveFeedbackCount\n          negativeFeedbackCount\n        }\n        createdAt\n      }\n    }\n  ": types.GetArticleInChoosingArticleDocument,
    "\n      mutation SubmitReplyRequestWithoutReason($id: String!) {\n        CreateOrUpdateReplyRequest(articleId: $id) {\n          replyRequestCount\n        }\n      }\n    ": types.SubmitReplyRequestWithoutReasonDocument,
    "\n    query GetReplyRelatedData($id: String!, $articleId: String!) {\n      GetReply(id: $id) {\n        type\n        text\n        reference\n        createdAt\n      }\n      GetArticle(id: $articleId) {\n        text\n        replyCount\n        createdAt\n        articleReplies {\n          replyId\n          createdAt\n        }\n      }\n    }\n  ": types.GetReplyRelatedDataDocument,
    "fragment CreateReferenceWordsReply on Reply {\n  reference\n  type\n  createdAt\n}\n\nfragment CreateReplyMessagesReply on Reply {\n  text\n  ...CreateReferenceWordsReply\n}\n\nfragment CreateReplyMessagesArticle on Article {\n  replyCount\n  createdAt\n}\n\nfragment CreateHighlightContentsHighlight on Highlights {\n  text\n  hyperlinks {\n    title\n    summary\n  }\n}": types.CreateReferenceWordsReplyFragmentDoc,
    "\n      mutation CreateAIReply($articleId: String!) {\n        CreateAIReply(articleId: $articleId) {\n          text\n          createdAt\n        }\n      }\n    ": types.CreateAiReplyDocument,
    "\n    query ListArticlesInInitState($text: String!) {\n      ListArticles(\n        filter: { moreLikeThis: { like: $text } }\n        orderBy: [{ _score: DESC }]\n        first: 4\n      ) {\n        edges {\n          node {\n            id\n            text\n            articleType\n            attachmentUrl(variant: THUMBNAIL)\n            replyCount\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  ": types.ListArticlesInInitStateDocument,
    "\n    query ListArticlesInProcessMedia($mediaUrl: String!) {\n      ListArticles(\n        filter: {\n          mediaUrl: $mediaUrl\n          articleTypes: [TEXT, IMAGE, AUDIO, VIDEO]\n          transcript: { shouldCreate: true }\n        }\n        orderBy: [{ _score: DESC }]\n        first: 9\n      ) {\n        edges {\n          score\n          mediaSimilarity\n          node {\n            id\n            articleType\n            attachmentUrl(variant: THUMBNAIL)\n            replyCount\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  ": types.ListArticlesInProcessMediaDocument,
    "\n    mutation SetCooccurrences($articleIds: [String!]!) {\n      CreateOrUpdateCooccurrence(articleIds: $articleIds) {\n        id\n      }\n    }\n  ": types.SetCooccurrencesDocument,
    "\n        mutation AddReplyRequestForUnrepliedArticle($articleId: String!) {\n          CreateOrUpdateReplyRequest(articleId: $articleId) {\n            id\n          }\n        }\n      ": types.AddReplyRequestForUnrepliedArticleDocument,
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
export function graphql(source: "\n          mutation SubmitTextArticleUnderConsent($text: String!) {\n            CreateArticle(text: $text, reference: { type: LINE }) {\n              id\n            }\n          }\n        "): (typeof documents)["\n          mutation SubmitTextArticleUnderConsent($text: String!) {\n            CreateArticle(text: $text, reference: { type: LINE }) {\n              id\n            }\n          }\n        "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n        mutation SubmitMediaArticleUnderConsent(\n          $mediaUrl: String!\n          $articleType: ArticleTypeEnum!\n        ) {\n          CreateMediaArticle(\n            mediaUrl: $mediaUrl\n            articleType: $articleType\n            reference: { type: LINE }\n          ) {\n            id\n          }\n        }\n      "): (typeof documents)["\n        mutation SubmitMediaArticleUnderConsent(\n          $mediaUrl: String!\n          $articleType: ArticleTypeEnum!\n        ) {\n          CreateMediaArticle(\n            mediaUrl: $mediaUrl\n            articleType: $articleType\n            reference: { type: LINE }\n          ) {\n            id\n          }\n        }\n      "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetArticleInChoosingArticle($id: String!) {\n      GetArticle(id: $id) {\n        text\n        replyCount\n        articleType\n        articleReplies(status: NORMAL) {\n          reply {\n            id\n            type\n            text\n          }\n          positiveFeedbackCount\n          negativeFeedbackCount\n        }\n        createdAt\n      }\n    }\n  "): (typeof documents)["\n    query GetArticleInChoosingArticle($id: String!) {\n      GetArticle(id: $id) {\n        text\n        replyCount\n        articleType\n        articleReplies(status: NORMAL) {\n          reply {\n            id\n            type\n            text\n          }\n          positiveFeedbackCount\n          negativeFeedbackCount\n        }\n        createdAt\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation SubmitReplyRequestWithoutReason($id: String!) {\n        CreateOrUpdateReplyRequest(articleId: $id) {\n          replyRequestCount\n        }\n      }\n    "): (typeof documents)["\n      mutation SubmitReplyRequestWithoutReason($id: String!) {\n        CreateOrUpdateReplyRequest(articleId: $id) {\n          replyRequestCount\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetReplyRelatedData($id: String!, $articleId: String!) {\n      GetReply(id: $id) {\n        type\n        text\n        reference\n        createdAt\n      }\n      GetArticle(id: $articleId) {\n        text\n        replyCount\n        createdAt\n        articleReplies {\n          replyId\n          createdAt\n        }\n      }\n    }\n  "): (typeof documents)["\n    query GetReplyRelatedData($id: String!, $articleId: String!) {\n      GetReply(id: $id) {\n        type\n        text\n        reference\n        createdAt\n      }\n      GetArticle(id: $articleId) {\n        text\n        replyCount\n        createdAt\n        articleReplies {\n          replyId\n          createdAt\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "fragment CreateReferenceWordsReply on Reply {\n  reference\n  type\n  createdAt\n}\n\nfragment CreateReplyMessagesReply on Reply {\n  text\n  ...CreateReferenceWordsReply\n}\n\nfragment CreateReplyMessagesArticle on Article {\n  replyCount\n  createdAt\n}\n\nfragment CreateHighlightContentsHighlight on Highlights {\n  text\n  hyperlinks {\n    title\n    summary\n  }\n}"): (typeof documents)["fragment CreateReferenceWordsReply on Reply {\n  reference\n  type\n  createdAt\n}\n\nfragment CreateReplyMessagesReply on Reply {\n  text\n  ...CreateReferenceWordsReply\n}\n\nfragment CreateReplyMessagesArticle on Article {\n  replyCount\n  createdAt\n}\n\nfragment CreateHighlightContentsHighlight on Highlights {\n  text\n  hyperlinks {\n    title\n    summary\n  }\n}"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n      mutation CreateAIReply($articleId: String!) {\n        CreateAIReply(articleId: $articleId) {\n          text\n          createdAt\n        }\n      }\n    "): (typeof documents)["\n      mutation CreateAIReply($articleId: String!) {\n        CreateAIReply(articleId: $articleId) {\n          text\n          createdAt\n        }\n      }\n    "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ListArticlesInInitState($text: String!) {\n      ListArticles(\n        filter: { moreLikeThis: { like: $text } }\n        orderBy: [{ _score: DESC }]\n        first: 4\n      ) {\n        edges {\n          node {\n            id\n            text\n            articleType\n            attachmentUrl(variant: THUMBNAIL)\n            replyCount\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    query ListArticlesInInitState($text: String!) {\n      ListArticles(\n        filter: { moreLikeThis: { like: $text } }\n        orderBy: [{ _score: DESC }]\n        first: 4\n      ) {\n        edges {\n          node {\n            id\n            text\n            articleType\n            attachmentUrl(variant: THUMBNAIL)\n            replyCount\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query ListArticlesInProcessMedia($mediaUrl: String!) {\n      ListArticles(\n        filter: {\n          mediaUrl: $mediaUrl\n          articleTypes: [TEXT, IMAGE, AUDIO, VIDEO]\n          transcript: { shouldCreate: true }\n        }\n        orderBy: [{ _score: DESC }]\n        first: 9\n      ) {\n        edges {\n          score\n          mediaSimilarity\n          node {\n            id\n            articleType\n            attachmentUrl(variant: THUMBNAIL)\n            replyCount\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  "): (typeof documents)["\n    query ListArticlesInProcessMedia($mediaUrl: String!) {\n      ListArticles(\n        filter: {\n          mediaUrl: $mediaUrl\n          articleTypes: [TEXT, IMAGE, AUDIO, VIDEO]\n          transcript: { shouldCreate: true }\n        }\n        orderBy: [{ _score: DESC }]\n        first: 9\n      ) {\n        edges {\n          score\n          mediaSimilarity\n          node {\n            id\n            articleType\n            attachmentUrl(variant: THUMBNAIL)\n            replyCount\n          }\n          highlight {\n            text\n            hyperlinks {\n              title\n              summary\n            }\n          }\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation SetCooccurrences($articleIds: [String!]!) {\n      CreateOrUpdateCooccurrence(articleIds: $articleIds) {\n        id\n      }\n    }\n  "): (typeof documents)["\n    mutation SetCooccurrences($articleIds: [String!]!) {\n      CreateOrUpdateCooccurrence(articleIds: $articleIds) {\n        id\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n        mutation AddReplyRequestForUnrepliedArticle($articleId: String!) {\n          CreateOrUpdateReplyRequest(articleId: $articleId) {\n            id\n          }\n        }\n      "): (typeof documents)["\n        mutation AddReplyRequestForUnrepliedArticle($articleId: String!) {\n          CreateOrUpdateReplyRequest(articleId: $articleId) {\n            id\n          }\n        }\n      "];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;