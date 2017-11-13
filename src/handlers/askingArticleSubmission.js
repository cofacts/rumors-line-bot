import gql from '../gql';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.searchedText) {
    throw new Error('searchText not set in data');
  }

  if (event.input === 'y') {
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
        text: `您回報的文章已經被收錄至：${process.env.SITE_URL}/article/${CreateArticle.id}`,
      },
      { type: 'text', text: '感謝您的回報！' },
    ];
  } else {
    replies = [{ type: 'text', text: '感謝您的使用。' }];
  }
  state = '__INIT__';

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
