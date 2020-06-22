import gql from 'src/lib/gql';
import UserSettings from 'src/database/models/userSettings';
import { revokeNotifyToken } from '../lineClient';

export default {
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

  async allowNotification(root, args, context) {
    const { allow } = args;
    const { userId } = context;
    let result = await UserSettings.setAllowNewReplyUpdate(userId, allow);
    const lineNotifyToken = result.newReplyNotifyToken;

    // revoke when user turns off notification and there exists lineNotifyToken
    if (!allow && lineNotifyToken) {
      revokeNotifyToken(lineNotifyToken);
      result = await UserSettings.setNewReplyNotifyToken(userId, null);
    }
    return result;
  },
};
