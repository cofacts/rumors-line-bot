import gql from '../gql';
import {
  createPostbackAction,
  getArticleURL,
  REASON_PLACEHOLDER,
} from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;
  const { selectedArticleId } = data;

  if (event.input !== 'n' && event.input !== REASON_PLACEHOLDER) {
    const reason = event.input;

    const text =
      `以下是您所填寫的理由：\n「\n${reason}\n」\n` +
      '我們即將把您填寫的理由送至資料庫。' +
      '若您送出的訊息或理由意味不明、造成闢謠編輯的困擾，可能會影響到您未來送出文章的權利。' +
      '若要確認請輸入「y」、若不想填寫請輸入「n」、若要重新填寫理由請輸入「r」';

    replies = [
      {
        type: 'flex',
        altText: text,
        contents: {
          type: 'bubble',
          styles: {
            footer: {
              separator: true,
            },
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: '把您的理由送進資料庫',
                weight: 'bold',
                color: '#1DB446',
                size: 'sm',
              },
              {
                type: 'separator',
                margin: 'xxl',
              },
              {
                type: 'text',
                text: '您之前傳送的訊息',
                weight: 'bold',
                size: 'xl',
                margin: 'xl',
              },
              {
                type: 'text',
                text: data.selectedArticleText,
                size: 'xs',
              },
              {
                type: 'separator',
                margin: 'xxl',
              },
              {
                type: 'text',
                text: '覺得是謠言的理由',
                weight: 'bold',
                size: 'xl',
                margin: 'xl',
              },
              {
                type: 'text',
                text: reason,
                size: 'xxs',
              },
              {
                type: 'separator',
                margin: 'xxl',
              },
              {
                type: 'text',
                text:
                  '若您送出的理由意味不明、造成闢謠編輯的困擾，可能會影響到您未來送出文章的權利。',
                color: '#ff0000',
                wrap: true,
                margin: 'xxl',
              },
              {
                type: 'button',
                margin: 'xl',
                style: 'primary',
                action: createPostbackAction('我不想填了', 'n', issuedAt),
              },
              {
                type: 'button',
                action: createPostbackAction('重寫送出的理由', 'r', issuedAt),
              },
              {
                type: 'button',
                action: createPostbackAction('明白我要送出', 'y', issuedAt),
              },
            ],
          },
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
