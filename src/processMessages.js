import stringSimilarity from 'string-similarity';
import gql from './gql';

const host = 'https://cofacts.g0v.tw';

export function createPostbackAction(label, input, issuedAt) {
  return {
    type: 'postback',
    label,
    data: JSON.stringify({
      input,
      issuedAt,
    }),
  };
}

export function createFeedbackWords(feedbacks) {
  let positive = 0, negative = 0;
  feedbacks.forEach(e => {
    if (e.score > 0) {
      positive++;
    }
    if (e.score < 0) {
      negative++;
    }
  });
  if (positive + negative === 0) return '[還沒有人針對此回應評價]';
  let result = '';
  if (positive) result += `有 ${positive} 人覺得此回應有幫助\n`;
  if (negative) result += `有 ${negative} 人覺得此回應沒幫助\n`;
  return `[${result.trim()}]`;
}

export function createReferenceWords(reference) {
  if (reference) return `出處：${reference}`;
  return '出處：此回應沒有出處';
}

export async function initState(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  // Store user input into context
  data.searchedText = event.input;

  // Search for articles
  const { data: { ListArticles } } = await gql`query($text: String!) {  
        ListArticles(filter: {moreLikeThis: {like: $text}}, orderBy: [{_score: DESC}], first: 4) {
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
  if (ListArticles.edges.length) {
    if (ListArticles.edges.length === 1) {
      const foundText = ListArticles.edges[0].node.text;
      const similarity = stringSimilarity.compareTwoStrings(
        event.input,
        foundText
      );
      if (similarity >= SIMILARITY_THRESHOLD) {
        // choose for user
        event.input = 1;

        // Store article ids
        data.foundArticleIds = ListArticles.edges.map(({ node: { id } }) => id);

        return {
          data,
          state: 'CHOOSING_ARTICLE',
          event,
          issuedAt,
          userId,
          replies,
          isSkipUser: true,
        };
      }
    }

    const templateMessage = {
      type: 'template',
      altText: ListArticles.edges
        .map(
          ({ node: { text } }, idx) => `選擇請打 ${idx + 1}> ${text.slice(0, 20)}`
        )
        .concat(['若以上皆非，請打 0。'])
        .join('\n\n'),
      template: {
        type: 'carousel',
        columns: ListArticles.edges
          .map(({ node: { text } }, idx) => ({
            text: `[相似度:${(stringSimilarity.compareTwoStrings(event.input, text) * 100).toFixed(2) + '%'}] \n ${text.slice(0, 105)}`,
            actions: [createPostbackAction('選擇此則', idx + 1, issuedAt)],
          }))
          .concat([
            {
              text: '這裡沒有一篇是我傳的訊息。',
              actions: [createPostbackAction('選擇', 0, issuedAt)],
            },
          ]),
      },
    };

    // Store article ids
    data.foundArticleIds = ListArticles.edges.map(({ node: { id } }) => id);

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
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}

export async function choosingArticle(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.foundArticleIds) {
    throw new Error('foundArticleIds not set in data');
  }

  data.selectedArticleId = data.foundArticleIds[event.input - 1];
  const { selectedArticleId } = data;

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
          result.rumorReplies.push({
            ...reply,
            feedbacks,
            replyConnectionId: id,
          });
        } else if (reply.versions[0].type === 'NOT_RUMOR') {
          result.notRumorReplies.push({
            ...reply,
            feedbacks,
            replyConnectionId: id,
          });
        }
        return result;
      },
      { rumorReplies: [], notRumorReplies: [] }
    );

    replies = [];

    if (notRumorReplies.length + rumorReplies.length !== 0) {
      data.foundReplies = notRumorReplies
        .concat(rumorReplies)
        .map(({ replyConnectionId, id }) => ({
          id,
          replyConnectionId,
        }));
      state = 'CHOOSING_REPLY';

      if (notRumorReplies.length + rumorReplies.length === 1) {
        // choose for user
        event.input = 1;

        return {
          data,
          state: 'CHOOSING_REPLY',
          event,
          issuedAt,
          userId,
          replies,
          isSkipUser: true,
        };
      }

      if (notRumorReplies.length) {
        replies.push({
          type: 'text',
          text: `這篇文章有 ${notRumorReplies.length} 個回應認為含有真實訊息：`,
        });
        replies.push({
          type: 'template',
          altText: notRumorReplies
            .map(
              ({ versions, feedbacks }, idx) =>
                `閱讀請傳 ${idx + 1}> ${createFeedbackWords(feedbacks)} \n ${versions[0].text.slice(0, 20)}`
            )
            .join('\n\n'),
          template: {
            type: 'carousel',
            columns: notRumorReplies.map(({ versions, feedbacks }, idx) => ({
              text: createFeedbackWords(feedbacks) +
                '\n' +
                versions[0].text.slice(0, 90),
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
              ({ versions, feedbacks }, idx) =>
                `閱讀請傳 ${notRumorReplies.length + idx + 1}> ${createFeedbackWords(feedbacks)} \n ${versions[0].text.slice(0, 20)}`
            )
            .join('\n\n'),
          template: {
            type: 'carousel',
            columns: rumorReplies.map(({ versions, feedbacks }, idx) => ({
              text: createFeedbackWords(feedbacks) +
                '\n' +
                versions[0].text.slice(0, 90),
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
          text: `詳情請見：${host}/article/${selectedArticleId}`,
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
          text: `若有最新回應，會寫在這個地方：${host}/article/${selectedArticleId}`,
        },
      ];

      state = '__INIT__';
    }
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}

export async function choosingReply(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

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
        text: `這則回應認為文章${GetReply.versions[0].type === 'RUMOR' ? '含有不實訊息' : '含有真實訊息'}，理由為：`,
      },
      { type: 'text', text: GetReply.versions[0].text },
      {
        type: 'text',
        text: createReferenceWords(GetReply.versions[0].reference),
      },
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
      {
        type: 'text',
        text: `可以到以下網址閱讀其他回應：${host}/article/${data.selectedArticleId}`,
      },
    ];

    data.selectedReply = selectedReply;
    state = 'ASKING_REPLY_FEEDBACK';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}

export async function askingReplyFeedback(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

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
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}

export async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

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
        text: `您回報的文章已經被收錄至：${host}/article/${CreateArticle.id}`,
      },
      { type: 'text', text: '感謝您的回報！' },
    ];
  } else {
    replies = [{ type: 'text', text: '感謝您的使用。' }];
  }
  state = '__INIT__';

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}

export function defaultState(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  replies = [
    {
      type: 'text',
      text: '我們看不懂 QQ\n大俠請重新來過。',
    },
  ];
  state = '__INIT__';
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}

const SIMILARITY_THRESHOLD = 0.95;

// State diagram:
// http://bit.ly/2kZY6kL
//
export async function processMessages(
  { state = '__INIT__', data = {} },
  event,
  issuedAt, // When this request is issued. Will be written in postback replies.
  userId
) {
  let replies;
  let isSkipUser = false;

  if (event.input === undefined) {
    throw new Error('input undefined');
  }

  if (event.input.length >= 3) {
    // If input contains more than 3 words,
    // consider it as a new query and start over.
    data = {};
    state = '__INIT__';
  }

  let params = {
    data,
    state,
    event,
    issuedAt,
    userId,
    replies,
    isSkipUser,
  };

  // Sets state, data and replies
  //
  do {
    params.isSkipUser = false;
    switch (params.state) {
      case '__INIT__': {
        params = await initState(params);
        break;
      }
      case 'CHOOSING_ARTICLE': {
        params = await choosingArticle(params);
        break;
      }
      case 'CHOOSING_REPLY': {
        params = await choosingReply(params);
        break;
      }
      case 'ASKING_REPLY_FEEDBACK': {
        params = await askingReplyFeedback(params);
        break;
      }
      case 'ASKING_ARTICLE_SUBMISSION': {
        params = await askingArticleSubmission(params);
        break;
      }
      default: {
        params = defaultState(params);
        break;
      }
    }
    ({ isSkipUser } = params);
  } while (isSkipUser);

  ({ state, data, replies } = params);

  return {
    context: { state, data },
    replies,
  };
}
