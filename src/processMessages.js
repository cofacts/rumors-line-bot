import gql from './gql';

// State diagram:
// http://bit.ly/2kZY6kL
//
export default async function processMessages(
  { state = '__INIT__', data = {} },
  event,
) {
  let replies;

  // Sets state, data and replies
  //
  switch (state) {
    case '__INIT__': {
      replies = [
        {
          type: 'text',
          text: event.message.text,
        },
      ];

      data.searchedText = event.message.text;

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
        text: event.message.text,
      });

      if (SearchArticles.length) {
        const templateMessage = {
          type: 'template',
          altText: '電腦版 QQ',
          template: {
            type: 'carousel',
            columns: SearchArticles.edges.map(({ node: { text, id } }) => ({
              text: text.slice(0, 119),
              actions: [
                {
                  type: 'postback',
                  label: 'Select',
                  data: id,
                },
              ],
            })),
          },
        };

        // Store articles
        data.foundArticleEdgess = SearchArticles.edges;

        replies = [templateMessage];
        state = 'CHOOSING_ARTICLE';
      } else {
        replies = [{
          type: 'text',
          text: '找不到這篇文章耶 QQ 請問要將文章送出到資料庫嗎？',
        }];
        state = 'ASKING_ARTICLE_SUBMISSION';
      }

      break;
    }
    case 'CHOOSING_ARTICLE': {
      break;
    }
    case 'CHOOSING_REPLY': {
      break;
    }
    case 'ASKING_REPLY_FEEDBACK': {
      break;
    }
    case 'ASKING_ARTICLE_SUBMISSION': {
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
