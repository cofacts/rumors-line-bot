import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import { REASON_PREFIX, getArticleURL, createArticleShareReply } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  const visitor = ga(userId, state, data.searchedText);

  if (!event.input.startsWith(REASON_PREFIX)) {
    replies = [
      {
        type: 'text',
        text:
          '請點擊上面的「送出按鈕」送出目前的訊息到資料庫，或轉傳其他訊息。',
      },
    ];
  } else {
    visitor.event({ ec: 'Article', ea: 'Create', el: 'Yes' });

    const reason = event.input.slice(REASON_PREFIX.length);
    const {
      data: { CreateArticle },
    } = await gql`
      mutation($text: String!, $reason: String!) {
        CreateArticle(text: $text, reason: $reason, reference: { type: LINE }) {
          id
        }
      }
    `({ text: data.searchedText, reason }, { userId });

    const articleUrl = getArticleURL(CreateArticle.id);

    replies = [
      {
        type: 'text',
        text: `您回報的訊息已經被收錄至：${articleUrl}`,
      },
      createArticleShareReply(articleUrl, reason),
    ];
    state = '__INIT__';
  }

  visitor.send();
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
