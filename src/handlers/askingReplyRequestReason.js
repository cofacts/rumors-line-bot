import gql from '../gql';
import { createPostbackAction, getArticleURL } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;
  const { selectedArticleId } = data;

  if (event.input !== 'n') {
    const reason = event.input;

    replies = [
      {
        type: 'text',
        text: `以下是您所填寫的理由：\n「\n${reason}\n」`,
      },
      {
        type: 'text',
        text:
          '我們即將把此訊息與您填寫的理由送至資料庫。若您送出的訊息或理由意味不明、' +
          '造成闢謠編輯的困擾，可能會影響到您未來送出文章的權利。',
      },
      {
        type: 'template',
        altText:
          '若要確認請輸入「y」、若要放棄請輸入「n」、若要重新填寫理由請輸入「r」',
        template: {
          type: 'buttons',
          text: '請確認',
          actions: [
            createPostbackAction('明白我要送出', 'y', issuedAt),
            createPostbackAction('重寫送出的理由', 'r', issuedAt),
            createPostbackAction('我不想填理由', 'n', issuedAt),
          ],
        },
      },
    ];
    data.reasonText = reason;
    state = 'ASKING_REPLY_REQUEST_SUBMISSION';
  } else {
    const {
      data: { CreateReplyRequest },
    } = await gql`
      mutation($id: String!) {
        CreateReplyRequest(articleId: $id) {
          replyRequestCount
        }
      }
    `({ id: selectedArticleId }, { userId });

    replies = [
      {
        type: 'text',
        text: `已經將您的需求記錄下來了，共有 ${
          CreateReplyRequest.replyRequestCount
        } 人跟您一樣渴望看到針對這篇訊息的回應。若有最新回應，會寫在這個地方：${getArticleURL(
          selectedArticleId
        )}`,
      },
    ];
    state = '__INIT__';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
