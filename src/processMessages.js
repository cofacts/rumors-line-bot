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
          ).concat(['若以上皆非，請打 0。']).join('\n\n'),
          template: {
            type: 'carousel',
            columns: SearchArticles.edges.map(({ node: { text } }, idx) => ({
              text: text.slice(0, 119),
              actions: [
                createPostbackAction('選擇此則', idx + 1, issuedAt),
              ],
            })).concat([{
              text: '這裡沒有一篇是我傳的訊息。',
              actions: [
                createPostbackAction('選擇', 0, issuedAt),
              ],
            }]),
          },
        };

        // Store article ids
        data.foundArticleIds = SearchArticles.edges.map(({ node: { id } }) => id);

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
      if (!data.foundArticleIds) {
        throw new Error('foundArticleIds not set in data');
      }

      const selectedArticleId = data.foundArticleIds[event.input - 1];

      if (+event.input === 0) {
        replies = [{
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
      } else if (!selectedArticleId) {
        replies = [
          { type: 'text', text: `請輸入 1～${data.foundArticleIds.length} 的數字。` },
        ];

        state = 'CHOOSING_ARTICLE';
      } else {
        const { data: { GetArticle } } = await gql`query($id: String!) {
          GetArticle(id: $id) {
            replies {
              id
              versions(limit: 1) {
                type
                text
                reference
                createdAt
              }
            }
          }
        }`({
          id: selectedArticleId,
        });

        const { rumorReplies, notRumorReplies } = GetArticle.replies.reduce(
          (result, reply) => {
            if (reply.versions[0].type === 'RUMOR') {
              result.rumorReplies.push(reply);
            } else if (reply.versions[0].type === 'NOT_RUMOR') {
              result.notRumorReplies.push(reply);
            }
            return result;
          },
          { rumorReplies: [], notRumorReplies: [] },
        );

        replies = [];
        if (notRumorReplies.length) {
          replies.push({ type: 'text', text: `這篇文章有 ${notRumorReplies.length} 個回應表示查無不實：` });
          replies.push({
            type: 'template',
            altText: notRumorReplies.map(
              ({ versions }, idx) => `閱讀請傳 ${idx + 1}> ${versions[0].text.slice(0, 20)}`,
            ).join('\n\n'),
            template: {
              type: 'carousel',
              columns: notRumorReplies.map(({ versions }, idx) => ({
                text: versions[0].text.slice(0, 119),
                actions: [
                  createPostbackAction('閱讀此回應', idx + 1, issuedAt),
                ],
              })),
            },
          });
        }
        if (rumorReplies.length) {
          replies.push({ type: 'text', text: `這篇文章有 ${rumorReplies.length} 個回應覺得有不實之處：` });
          replies.push({
            type: 'template',
            altText: rumorReplies.map(
              ({ versions }, idx) => `閱讀請傳 ${notRumorReplies.length + idx + 1}> ${versions[0].text.slice(0, 20)}`,
            ).join('\n\n'),
            template: {
              type: 'carousel',
              columns: rumorReplies.map(({ versions }, idx) => ({
                text: versions[0].text.slice(0, 119),
                actions: [
                  createPostbackAction('閱讀此回應', notRumorReplies.length + idx + 1, issuedAt),
                ],
              })),
            },
          });
        }

        if (GetArticle.replies.length === 0) {
          // No one has replied to this yet.
          // TODO: Send replyRequest for the user.
          //
          replies = [
            { type: 'text', text: '目前還沒有人回應這篇文章唷。' },
            { type: 'text', text: `若有最新回應，會寫在這個地方：http://rumors.hacktabl.org/article/${data.selectedArticleId}` },
          ];
          state = '__INIT__';
        } else if (replies.length === 0) {
          // Someone reported that it is not an article,
          // and there are no other replies available.
          //
          replies = [
            { type: 'text', text: '有人認為您傳送的這則訊息並不是完整的文章內容，或認為「真的假的」不應該處理這則訊息。' },
            { type: 'text', text: `詳情請見：http://rumors.hacktabl.org/article/${data.selectedArticleId}` },
          ];
          state = '__INIT__';
        } else {
          data.foundReplyIds = notRumorReplies.map(({ id }) => id)
            .concat(rumorReplies.map(({ id }) => id));
          state = 'CHOOSING_REPLY';
        }
      }

      break;
    }
    case 'CHOOSING_REPLY': {
      if (!data.foundReplyIds) {
        throw new Error('foundReplyIds not set in data');
      }

      const selectedReplyId = data.foundReplyIds[event.input - 1];

      if (!selectedReplyId) {
        replies = [
          { type: 'text', text: `請輸入 1～${data.foundReplyIds.length} 的數字。` },
        ];

        state = 'CHOOSING_REPLY';
      } else {
        const { data: { GetReply } } = await gql`query($id: String!) {
          GetReply(id: $id) {
            versions(limit: 1) {
              type
              text
              reference
              createdAt
            }
          }
        }`({
          id: selectedReplyId,
        });

        replies = [
          { type: 'text', text: `這則回應認為文章${GetReply.versions[0].type === 'RUMOR' ? '含有不實訊息' : '不含不實訊息'}，理由為：` },
          { type: 'text', text: GetReply.versions[0].text },
          { type: 'text', text: `出處：${GetReply.versions[0].reference}` },
          {
            type: 'template',
            altText: '請問這則回應是否有解答原文章？\n「是」請輸入「y」，「否」請輸入其他任何訊息。',
            template: {
              type: 'buttons',
              text: '請問這則回應是否有解答原文章？',
              actions: [
                createPostbackAction('是', 'y', issuedAt),
                createPostbackAction('否', 'n', issuedAt),
              ],
            },
          },
        ];

        state = 'ASKING_REPLY_FEEDBACK';
      }

      break;
    }
    case 'ASKING_REPLY_FEEDBACK': {
      if (!data.foundReplyIds) {
        throw new Error('foundReplyIds not set in data');
      }
      // TODO: send feedback
      //
      replies = [
        { type: 'text', text: '感謝您的回饋。' },
      ];
      state = '__INIT__';
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
      state = '__INIT__';
  }

  return {
    context: { state, data },
    replies,
  };
}
