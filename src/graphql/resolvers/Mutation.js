import gql from 'src/lib/gql';

export default {
  async submitArticle(root, args, context) {
    const {
      userContext: {
        data: { searchedText },
      },
      userId,
    } = context;

    if (!searchedText) {
      throw new Error('searchedText not in user context');
    }

    const {
      data: {
        CreateArticle: { id },
      },
    } = await gql`
      mutation($text: String!, $reason: String!) {
        CreateArticle(text: $text, reference: { type: LINE }) {
          id
        }
      }
    `({ text: searchedText }, { userId });

    return id;
  },

  async voteReply(root, args, context) {
    const { vote } = args;
    const {
      userContext: {
        data: { selectedArticleId, selectedReplyId },
      },
      userId,
    } = context;

    if (!selectedArticleId || !selectedReplyId) {
      throw new Error(
        'selectedArticleId or selectedReplyId not in user context'
      );
    }

    const {
      data: { CreateOrUpdateArticleReplyFeedback },
    } = await gql`
      mutation($vote: FeedbackVote!, $articleId: String!, $replyId: String!) {
        CreateOrUpdateArticleReplyFeedback(
          vote: $vote
          articleId: $articleId
          replyId: $replyId
        ) {
          feedbackCount
        }
      }
    `(
      {
        articleId: selectedArticleId,
        replyId: selectedReplyId,
        vote,
      },
      { userId }
    );

    return CreateOrUpdateArticleReplyFeedback.feedbackCount;
  },
};
