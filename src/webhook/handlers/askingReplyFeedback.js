import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import { getArticleURL, DOWNVOTE_PREFIX } from 'src/lib/sharedUtils';
import { createTypeWords, ellipsis } from './utils';

export default async function askingReplyFeedback(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.selectedReplyId) {
    throw new Error('selectedReply not set in data');
  }

  const visitor = ga(userId, state, data.selectedArticleText);

  // Track when user give feedback.
  visitor.event({
    ec: 'UserInput',
    ea: 'Feedback-Vote',
    el: `${data.selectedArticleId}/${data.selectedReplyId}`,
  });

  if (event.input === 'y') {
    const {
      data: {
        action: { feedbackCount },
      },
    } = await gql`
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
        vote: 'UPVOTE',
      },
      { userId }
    );
    const {
      data: { GetReply },
    } = await gql`
      query($replyId: String!) {
        GetReply(id: $replyId) {
          type
          text
          reference
        }
      }
    `({
      replyId: data.selectedReplyId,
    });

    const articleUrl = getArticleURL(data.selectedArticleId);
    let sharedText = `網路上有人說「${ellipsis(
      data.selectedArticleText,
      15
    )}」 ${createTypeWords(
      GetReply.type
    )}喔！\n\n請至 ${articleUrl} 看看鄉親們針對這則訊息的回應、理由，與相關的出處唷！`;

    replies = [
      {
        type: 'text',
        text:
          feedbackCount > 1
            ? `感謝您與其他 ${feedbackCount - 1} 人的回饋。`
            : '感謝您的回饋，您是第一個評論這個回應的人 :)',
      },
      {
        type: 'template',
        altText: `📲 別忘了把上面的回應轉傳回您的聊天室，給其他人也看看！\n💁 若您認為自己能回應得更好，歡迎到 ${articleUrl} 提交新的回應唷！`,
        template: {
          type: 'confirm',
          text: `📲 別忘了把上面的回應轉傳回您的聊天室，給其他人也看看！\n💁 若您認為自己能回應得更好，歡迎提交新的回應唷！`,
          actions: [
            {
              type: 'uri',
              label: '分享給朋友',
              uri: `line://msg/text/?${encodeURI(sharedText)}`,
            },
            {
              type: 'uri',
              label: '提交新回應',
              uri: getArticleURL(data.selectedArticleId),
            },
          ],
        },
      },
    ];

    visitor.send();
    state = '__INIT__';
  } else if (event.input.startsWith(DOWNVOTE_PREFIX)) {
    const comment = event.input.slice(DOWNVOTE_PREFIX.length);
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
        comment,
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

    visitor.send();
    state = '__INIT__';
  } else {
    replies = [
      {
        type: 'text',
        text:
          '請點擊上面的「是」、「否」對回應表達意見，或改轉傳其他訊息給我查詢。',
      },
    ];

    // Don't do visitor.send() nor change state here because user did not respond yet
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
