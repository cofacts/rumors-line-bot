import stringSimilarity from 'string-similarity';
import gql from './gql';

function createPostbackAction(label, input, issuedAt) {
  return {
    type: 'postback',
    label,
    data: JSON.stringify({
      input,
      issuedAt,
    }),
  };
}

function createFeebackWords(feedbacks) {
  let positive = 0, negative = 0;
  feedbacks.forEach((e) => {
    if (e.score > 0) { positive++; }
    if (e.score < 0) { negative++; }
  });
  if (positive + negative === 0) return '[還沒有人針對此回應評價]';
  let result = '';
  if (positive) result += `有 ${positive} 人覺得此回應有幫助\n`;
  if (negative) result += `有 ${negative} 人覺得此回應有幫助\n`;
  return `[${result.trim()}]`;
}

const SIMILARITY_THRESHOLD = 0.95;

// State diagram:
// http://bit.ly/2kZY6kL
//
export default async function processMessages(
  { state = '__INIT__', data = {} },
  event,
  issuedAt, // When this request is issued. Will be written in postback replies.
  userId
) {
  let replies;

  if (event.input.length >= 3) {
    // If input contains more than 3 words,
    // consider it as a new query and start over.
    data = {};
    state = '__INIT__';
  }

  // Sets state, data and replies
  //
  switch (state) {
    case '__INIT__': {
      // Store user input into context
      data.searchedText = event.input;

      // Search for articles
      const { data: { SearchArticles } } = await gql`query($text: String!) {
        SearchArticles(text: $text, orderBy: [{_score: DESC}], first: 4) {
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

      const articleSummary = `${event.input.slice(0, 10)}${event.input.length > 10 ? '⋯⋯' : ''}`;
      if (SearchArticles.edges.length) {
        if (SearchArticles.edges.length === 1) {
          const foundText = SearchArticles.edges[0].node.text;
          const similarity = stringSimilarity.compareTwoStrings(event.input, foundText);
          if (similarity >= SIMILARITY_THRESHOLD) {
            // choose for user
            event.input = 1;

            // Store article ids
            data.foundArticleIds = SearchArticles.edges.map(
              ({ node: { id } }) => id
            );
            return processMessages(
              {
                state: 'CHOOSING_ARTICLE',
                data,
              },
              event,
              issuedAt,
              userId
            );
          }
        }

        const templateMessage = {
          type: 'template',
          altText: SearchArticles.edges
            .map(
            (
              { node: { text } },
              idx
            ) => `選擇請打 ${idx + 1}> ${text.slice(0, 20)}`
            )
            .concat(['若以上皆非，請打 0。'])
            .join('\n\n'),
          template: {
            type: 'carousel',
            columns: SearchArticles.edges.map(({ node: { text } }, idx) => ({
              text: `[相似度:${stringSimilarity.compareTwoStrings(event.input, text).toFixed(2)}] \n ${text.slice(0, 105)}`,
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
        data.foundArticleIds = SearchArticles.edges.map(
          ({ node: { id } }) => id
        );

        replies = [
          {
            type: 'text',
            text: `幫您查詢「${articleSummary}」的相關回應。`,
          },
          {
            type: 'text',
            text: '請問下列文章中，哪一篇是您剛才傳送的訊息呢？',
          },
          templateMessage,
        ];
        state = 'CHOOSING_ARTICLE';
      } else {
        replies = [
          {
            type: 'text',
            text: `找不到關於「${articleSummary}」文章耶 QQ`,
          },
          {
            type: 'template',
            altText: '請問要將這份文章送出到資料庫嗎？\n「是」請輸入「y」，「否」請輸入「n」或其他單一字母。',
            template: {
              type: 'buttons',
              text: '請問要將這份文章送出到資料庫嗎？',
              actions: [
                createPostbackAction('是', 'y', issuedAt),
                createPostbackAction('否', 'n', issuedAt),
              ],
            },
          },
        ];
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
        replies = [
          {
            type: 'template',
            altText: '請問要將文章送出到資料庫嗎？\n「是」請輸入「y」，「否」請輸入「n」或其他單一字母。',
            template: {
              type: 'buttons',
              text: '請問要將文章送出到資料庫嗎？',
              actions: [
                createPostbackAction('是', 'y', issuedAt),
                createPostbackAction('否', 'n', issuedAt),
              ],
            },
          },
        ];

        state = 'ASKING_ARTICLE_SUBMISSION';
      } else if (!selectedArticleId) {
        replies = [
          { type: 'text', text: `請輸入 1～${data.foundArticleIds.length} 的數字。` },
        ];

        state = 'CHOOSING_ARTICLE';
      } else {
        const { data: { GetArticle } } = await gql`query($id: String!) {
          GetArticle(id: $id) {
            replyCount
            replyConnections {
              id
              reply {
                id
                versions(limit: 1) {
                  type
                  text
                }
              }
              feedbacks {
                comment
                score
              }
            }
          }
        }`({
          id: selectedArticleId,
        });

        const {
          rumorReplies,
          notRumorReplies,
        } = GetArticle.replyConnections.reduce(
            (result, { reply, feedbacks, id }) => {
             if (reply.versions[0].type === 'RUMOR') {
                result.rumorReplies.push({ ...reply, feedbacks, replyConnectionId: id });
              } else if (reply.versions[0].type === 'NOT_RUMOR') {
                result.notRumorReplies.push({ ...reply, feedbacks, replyConnectionId: id });
              }
              return result;
            },
            { rumorReplies: [], notRumorReplies: [] }
          );

        replies = [];

        if (notRumorReplies.length + rumorReplies.length !== 0) {
          data.foundReplies = notRumorReplies.concat(rumorReplies).map(({ replyConnectionId, id }) => ({
            id,
            replyConnectionId,
          }));
          state = 'CHOOSING_REPLY';

          if (notRumorReplies.length + rumorReplies.length === 1) {

            // choose for user
            event.input = 1;

            return processMessages(
              {
                state: 'CHOOSING_REPLY',
                data,
              },
              event,
              issuedAt,
              userId
            );
          }

          if (notRumorReplies.length) {
            replies.push({
              type: 'text',
              text: `這篇文章有 ${notRumorReplies.length} 個回應表示查無不實：`,
            });
            replies.push({
              type: 'template',
              altText: notRumorReplies
                .map(
                (
                  { versions, feedbacks },
                  idx
                ) => `閱讀請傳 ${idx + 1}> ${createFeebackWords(feedbacks)} \n ${versions[0].text.slice(0, 20)}`
                )
                .join('\n\n'),
              template: {
                type: 'carousel',
                columns: notRumorReplies.map(({ versions, feedbacks }, idx) => ({
                  text: createFeebackWords(feedbacks) + '\n' + versions[0].text.slice(0, 90),
                  actions: [createPostbackAction('閱讀此回應', idx + 1, issuedAt)],
                })),
              },
            });
          }
          if (rumorReplies.length) {
            replies.push({
              type: 'text',
              text: `這篇文章有 ${rumorReplies.length} 個回應覺得有不實之處：`,
            });
            replies.push({
              type: 'template',
              altText: rumorReplies
                .map(
                (
                  { versions, feedbacks },
                  idx
                ) => `閱讀請傳 ${notRumorReplies.length + idx + 1}> ${createFeebackWords(feedbacks)} \n ${versions[0].text.slice(0, 20)}`
                )
                .join('\n\n'),
              template: {
                type: 'carousel',
                columns: rumorReplies.map(({ versions, feedbacks }, idx) => ({
                  text: createFeebackWords(feedbacks) + '\n' + versions[0].text.slice(0, 90),
                  actions: [
                    createPostbackAction(
                      '閱讀此回應',
                      notRumorReplies.length + idx + 1,
                      issuedAt
                    ),
                  ],
                })),
              },
            });
          }
        } else if (GetArticle.replyCount !== 0) {
          // [replyCount !=0 && replies == 0]
          // Someone reported that it is not an article,
          // and there are no other replies available.
          // FIXME (ggm) very tricky if condition here
          replies = [
            {
              type: 'text',
              text: '有人認為您傳送的這則訊息並不是完整的文章內容，或認為「真的假的」不應該處理這則訊息。',
            },
            {
              type: 'text',
              text: `詳情請見：http://rumors.hacktabl.org/article/${selectedArticleId}`,
            },
          ];
          state = '__INIT__';
        } else {
          // [replyCount ==0 && replies == 0]
          // No one has replied to this yet.
          const {
            data: { CreateReplyRequest },
            errors,
          } = await gql`mutation($id: String!) {
            CreateReplyRequest(articleId: $id) {
              replyRequestCount
            }
          }`({ id: selectedArticleId }, { userId });

          replies = [
            {
              type: 'text',
              text: `目前還沒有人回應這篇文章唷。${errors ? '' : `已經將您的需求記錄下來了，共有 ${CreateReplyRequest.replyRequestCount} 人跟您一樣渴望看到針對這篇文章的回應。`}`,
            },
            {
              type: 'text',
              text: `若有最新回應，會寫在這個地方：http://rumors.hacktabl.org/article/${selectedArticleId}`,
            },
          ];

          state = '__INIT__';
        }
      }

      break;
    }
    case 'CHOOSING_REPLY': {
      if (!data.foundReplies) {
        throw new Error('foundReplies not set in data');
      }

      const selectedReply = data.foundReplies[event.input - 1];

      if (!selectedReply) {
        replies = [
          { type: 'text', text: `請輸入 1～${data.foundReplies.length} 的數字。` },
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
        }`({ id: selectedReply.id });

        replies = [
          {
            type: 'text',
            text: `這則回應認為文章${GetReply.versions[0].type === 'RUMOR' ? '含有不實訊息' : '不含不實訊息'}，理由為：`,
          },
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

        data.selectedReply = selectedReply;
        state = 'ASKING_REPLY_FEEDBACK';
      }

      break;
    }
    case 'ASKING_REPLY_FEEDBACK': {
      if (!data.selectedReply) {
        throw new Error('selectedReply not set in data');
      }

      const {
        data: { action: { feedbackCount } },
      } = await gql`mutation($vote: FeedbackVote!, $id: String!){
        action: CreateOrUpdateReplyConnectionFeedback(
          vote: $vote
          replyConnectionId: $id
        ) {
          feedbackCount
        }
      }`(
        {
          id: data.selectedReply.replyConnectionId,
          vote: event.input === 'y' ? 'UPVOTE' : 'DOWNVOTE',
        },
        { userId }
        );

      replies = [
        {
          type: 'text',
          text: feedbackCount > 1
            ? `感謝您與其他 ${feedbackCount - 1} 人的回饋。`
            : '感謝您的回饋，您是第一個評論這份文章與回應的人 :)',
        },
      ];

      state = '__INIT__';
      break;
    }
    case 'ASKING_ARTICLE_SUBMISSION': {
      if (!data.searchedText) {
        throw new Error('searchText not set in data');
      }

      if (event.input === 'y') {
        const { data: { CreateArticle } } = await gql`mutation($text: String!){
          CreateArticle(text: $text, reference: {type: LINE}) {
            id
          }
        }`({ text: data.searchedText }, { userId });

        replies = [
          {
            type: 'text',
            text: `您回報的文章已經被收錄至：http://rumors.hacktabl.org/article/${CreateArticle.id}`,
          },
          { type: 'text', text: '感謝您的回報！' },
        ];
      } else {
        replies = [{ type: 'text', text: '感謝您的使用。' }];
      }
      state = '__INIT__';

      break;
    }

    default:
      replies = [
        {
          type: 'text',
          text: '我們看不懂 QQ\n大俠請重新來過。',
        },
      ];
      state = '__INIT__';
  }

  return {
    context: { state, data },
    replies,
  };
}
