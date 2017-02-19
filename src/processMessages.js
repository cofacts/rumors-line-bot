import gql from './gql';

function createPostbackAction(label, input, issuedAt) {
  return {
    type: 'postback',
    label,
    data: JSON.stringify({
      input, issuedAt,
    }),
  };
}

// State diagram:
// http://bit.ly/2kZY6kL
//
export default async function processMessages(
  { state = '__INIT__', data = {} },
  event,
  issuedAt, // When this request is issued. Will be written in postback replies.
) {
  let replies;

  // Sets state, data and replies
  //
  switch (state) {
    case '__INIT__': {
      // Store user input into context
      data.searchedText = event.input;

      // Search for articles
      const { data: { SearchArticles } } = await gql`query($text: String!) {
        SearchArticles(text: $text, orderBy: [{_score: DESC}]) {
          edges {
            node {
              text
              id
            }
          }
        }
      }`({
        text: event.input,
      });

      if (SearchArticles.edges.length) {
        const templateMessage = {
          type: 'template',
          altText: SearchArticles.edges.map(
            ({ node: { text } }, idx) => `選擇請打 ${idx + 1}> ${text.slice(0, 20)}`,
          ).join('\n\n'),
          template: {
            type: 'carousel',
            columns: SearchArticles.edges.map(({ node: { text } }, idx) => ({
              text: text.slice(0, 119),
              actions: [
                createPostbackAction('選擇此則', idx + 1, issuedAt),
              ],
            })),
          },
        };

        // Store articles
        data.foundArticles = SearchArticles.edges.map(({ node }) => node);

        replies = [
          {
            type: 'text',
            text: '請問下列文章中，哪一篇是您剛才傳送的訊息呢？',
          },
          templateMessage,
        ];
        state = 'CHOOSING_ARTICLE';
      } else {
        replies = [{
          type: 'text',
          text: '找不到這篇文章耶 QQ',
        }, {
          type: 'template',
          altText: '請問要將文章送出到資料庫嗎？\n「是」請輸入「y」，「否」請輸入其他任何訊息。',
          template: {
            type: 'buttons',
            text: '請問要將文章送出到資料庫嗎？',
            actions: [
              createPostbackAction('是', 'y', issuedAt),
              createPostbackAction('否', 'n', issuedAt),
            ],
          },
        }];
        state = 'ASKING_ARTICLE_SUBMISSION';
      }

      break;
    }
    case 'CHOOSING_ARTICLE': {
      if (!data.foundArticles) {
        throw new Error('foundArticles not set in data');
      }

      const selectedArticle = data.foundArticles[event.input - 1];

      if (!selectedArticle) {
        replies = [
          { type: 'text', text: `請輸入 1～${data.foundArticles.length} 的數字。` },
        ];

        state = 'CHOOSING_ARTICLE';
      } else {
        // TODO: finish writing this.
        replies = [
          {
            type: 'text',
            text: '這則文章有 0 個回應表示查無不實， 0 個回應覺得有不實之處。',
          },
        ];
        state = '__INIT__';
      }

      break;
    }
    case 'CHOOSING_REPLY': {
      break;
    }
    case 'ASKING_REPLY_FEEDBACK': {
      break;
    }
    case 'ASKING_ARTICLE_SUBMISSION': {
      if (!data.searchedText) {
        throw new Error('searchText not set in data');
      }

      const shouldSubmitArticle = event.input === 'y';
      if (shouldSubmitArticle) {
        const { data: { SetArticle } } = await gql`mutation($text: String){
          SetArticle(text: $text, references: [{type: LINE}]) {
            id
          }
        }`({
          text: data.searchedText,
        });

        replies = [
          { type: 'text', text: `您回報的文章已經被收錄至：http://rumors.hacktabl.org/article/${SetArticle.id}` },
          { type: 'text', text: '感謝您的回報！' },
        ];
      } else {
        replies = [
          { type: 'text', text: '感謝您的使用。' },
        ];
      }
      state = '__INIT__';

      break;
    }

    default:
      replies = [{
        type: 'text',
        text: '我們看不懂 QQ\n大俠請重新來過。',
      }];
  }

  return {
    context: { state, data },
    replies,
  };
}
