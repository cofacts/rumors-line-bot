import gql from '../gql';
import ga from '../ga';
import { getArticleURL } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.searchedText) {
    throw new Error('searchText not set in data');
  }

  if (event.input === 'y') {
    // Track wheather user create Article or not if the Article is not found in DB.
    ga(userId, { ec: 'Article', ea: 'Create', el: 'Yes' });

    const { data: { CreateArticle } } = await gql`
      mutation($text: String!) {
        CreateArticle(text: $text, reference: { type: LINE }) {
          id
        }
      }
    `({ text: data.searchedText }, { userId });

    replies = [
      {
        type: 'text',
        text: `您回報的訊息已經被收錄至：${getArticleURL(CreateArticle.id)}`,
      },
      { type: 'text', text: '感謝您的回報！' },
    ];
  } else {
    // Track wheather user create Article or not if the Article is not found in DB.
    ga(userId, { ec: 'Article', ea: 'Create', el: 'No' });

    replies = [{ type: 'text', text: '感謝您的使用。' }];
  }
  state = '__INIT__';

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
