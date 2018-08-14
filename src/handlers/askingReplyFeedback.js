import gql from '../gql';
import ga from '../ga';
import {
  getArticleURL,
  createPostbackAction,
  createTypeWords,
  ellipsis,
} from './utils';

export default async function askingReplyFeedback(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.selectedReplyId) {
    throw new Error('selectedReply not set in data');
  }

  // Track when user give feedback.
  ga(userId, {
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
      data: { GetReply, GetArticle },
    } = await gql`
      query($replyId: String!, $articleId: String!) {
        GetReply(id: $replyId) {
          type
          text
          reference
        }

        GetArticle(id: $articleId) {
          text
        }
      }
    `({
      articleId: data.selectedArticleId,
      replyId: data.selectedReplyId,
    });

    const articleUrl = getArticleURL(data.selectedArticleId);
    let sharedText = `網路上有人說「${ellipsis(
      GetArticle.text,
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

    state = '__INIT__';
    return { data, state, event, issuedAt, userId, replies, isSkipUser };
  }
  replies = [
    {
      type: 'template',
      altText: `請問您為什麼覺得好心人的回應沒有幫助？請按左下角「⌨️」鈕，把理由傳給我們，幫助闢謠編輯釐清問題所在；若不想填，請按「我不想填理由」按鈕。`,
      template: {
        type: 'buttons',
        text:
          '請問您為什麼覺得好心人的回應沒有幫助？請按左下角「⌨️」鈕，把理由傳給我們',
        actions: [createPostbackAction('我不想填理由', 'n', issuedAt)],
      },
    },
  ];

  state = 'ASKING_NOT_USEFUL_FEEDBACK';
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
