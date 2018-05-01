import ga from '../ga';
import { createPostbackAction } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

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
            createPostbackAction('放棄送出', 'n', issuedAt),
          ],
        },
      },
    ];
    data.reasonText = reason;
    state = 'ASKING_ARTICLE_SUBMISSION';
  } else {
    // Track whether user create Article or not if the Article is not found in DB.
    ga(userId, { ec: 'Article', ea: 'Create', el: 'No' });

    replies = [{ type: 'text', text: '訊息沒有送出，謝謝您的使用。' }];
    state = '__INIT__';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
