import gql from '../gql';
import ga from '../ga';

export default async function askingReplyFeedback(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.selectedReplyId) {
    throw new Error('selectedReply not set in data');
  }

  // Track when user give feedback.
  ga(userId, { ec: 'UserInput', ea: 'Feedback', el: 'VoteArticle' });

  const { data: { action: { feedbackCount } } } = await gql`
    mutation($vote: FeedbackVote!, $articleId: String!, $replyId: String!) {
      action: CreateOrUpdateArticleReplyFeedback(
        vote: $vote
        articleId: $articleId
        replyId: $replyId
      ) {
        feedbackCount
      }
    }
  `(
    {
      articleId: data.selectedArticleId,
      replyId: data.selectedReplyId,
      vote: event.input === 'y' ? 'UPVOTE' : 'DOWNVOTE',
    },
    { userId }
  );

  replies = [
    {
      type: 'text',
      text: feedbackCount > 1
        ? `感謝您與其他 ${feedbackCount - 1} 人的回饋。`
        : '感謝您的回饋，您是第一個評論這份文章與回應的人 :)',
    },
  ];

  state = '__INIT__';
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
