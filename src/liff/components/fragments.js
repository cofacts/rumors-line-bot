export const ArticleReplyHeader_articleReply = /* GraphQL */ `
  fragment ArticleReplyHeader_articleReply on CofactsAPIArticleReply {
    replyType
    user {
      name
      avatarUrl
      level
    }
    createdAt
  }
`;

export const ArticleReplyCard_articleReply = /* GraphQL */ `
  fragment ArticleReplyCard_articleReply on CofactsAPIArticleReply {
    ...ArticleReplyHeader_articleReply
    articleId
    reply {
      id
      text
      reference
    }
    positiveFeedbackCount
    negativeFeedbackCount
    ownVote
  }
  ${ArticleReplyHeader_articleReply}
`;
