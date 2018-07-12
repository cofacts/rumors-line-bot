import gql from '../gql';
import { getArticleURL, createPostbackAction } from './utils';

export default async function askingNotUsefulFeedbackSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.selectedReplyId) {
    throw new Error('selectedReply not set in data');
  }

  if (event.input !== 'r') {
    const {
      data: {
        action: { feedbackCount },
      },
    } = await gql`
      mutation(
        $comment: String!
        $vote: FeedbackVote!
        $articleId: String!
        $replyId: String!
      ) {
        action: CreateOrUpdateArticleReplyFeedback(
          comment: $comment
          articleId: $articleId
          replyId: $replyId
          vote: $vote
        ) {
          feedbackCount
        }
      }
    `(
      {
        articleId: data.selectedArticleId,
        replyId: data.selectedReplyId,
        comment: event.input === 'n' ? 'none' : data.comment,
        vote: 'DOWNVOTE',
      },
      { userId }
    );

    replies = [
      {
        type: 'text',
        text:
          feedbackCount > 1
            ? `感謝您與其他 ${feedbackCount - 1} 人的回饋。`
            : '感謝您的回饋，您是第一個評論這個回應的人 :)',
      },
      {
        type: 'text',
        text: `💁 若您認為自己能回應得更好，歡迎到 ${getArticleURL(
          data.selectedArticleId
        )} 提交新的回應唷！`,
      },
    ];

    state = '__INIT__';
  } else {
    replies = [
      {
        type: 'template',
        altText: `好的，請重新填寫理由`,
        template: {
          type: 'buttons',
          text: '好的，請重新填寫理由',
          actions: [createPostbackAction('我不想填了', 'n', issuedAt)],
        },
      },
    ];
    state = 'ASKING_NOT_USEFUL_FEEDBACK';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
