import gql from '../gql';
import {
  createPostbackAction,
  createFeedbackWords,
  createTypeWords,
  isNonsenseText,
  getArticleURL,
  createAskArticleSubmissionReply,
} from './utils';
import ga from '../ga';

/**
 * 第2句 (template message)：按照時間排序「不在查證範圍」之外的回應，每則回應第一行是
 * 「⭕ 含有真實訊息」或「❌ 含有不實訊息」之類的 (含 emoticon)，然後是回應文字。如果
 * 還有空間，才放「不在查證範圍」的回應。最後一句的最後一格顯示「看其他回應」，連到網站。
 */
function reorderArticleReplies(articleReplies) {
  const replies = [];
  const notArticleReplies = [];

  for (let articleReply of articleReplies) {
    if (articleReply.reply.type !== 'NOT_ARTICLE') {
      replies.push(articleReply);
    } else {
      notArticleReplies.push(articleReply);
    }
  }
  return replies.concat(notArticleReplies);
}

// https://developers.line.me/en/docs/messaging-api/reference/#template-messages
function createAltText(articleReplies) {
  const eachLimit = 400 / articleReplies.length - 5;
  return articleReplies
    .slice(0, 10)
    .map(({ reply, positiveFeedbackCount, negativeFeedbackCount }, idx) => {
      const prefix = `閱讀請傳 ${idx + 1}> ${createTypeWords(reply.type)}\n${createFeedbackWords(positiveFeedbackCount, negativeFeedbackCount)}`;
      const content = reply.text.slice(0, eachLimit - prefix.length);
      return `${prefix}\n${content}`;
    })
    .join('\n\n');
}

export default async function choosingArticle(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.foundArticleIds) {
    throw new Error('foundArticleIds not set in data');
  }

  data.selectedArticleId = data.foundArticleIds[event.input - 1];
  const { selectedArticleId } = data;
  const doesNotContainMyArticle = +event.input === 0;

  if (doesNotContainMyArticle && isNonsenseText(data.searchedText)) {
    replies = [
      {
        type: 'text',
        text: '剛才您傳的訊息僅包含連結或是資訊太少，無從查證。\n' +
          '查證範圍請參考📖使用手冊 http://bit.ly/cofacts-line-users',
      },
    ];
    state = '__INIT__';
  } else if (doesNotContainMyArticle) {
    replies = createAskArticleSubmissionReply(issuedAt);

    state = 'ASKING_ARTICLE_SUBMISSION';
  } else if (!selectedArticleId) {
    replies = [
      {
        type: 'text',
        text: `請輸入 1～${data.foundArticleIds.length} 的數字，來選擇訊息。`,
      },
    ];

    state = 'CHOOSING_ARTICLE';
  } else {
    const { data: { GetArticle } } = await gql`
      query($id: String!) {
        GetArticle(id: $id) {
          replyCount
          articleReplies(status: NORMAL) {
            reply {
              id
              type
              text
            }
            positiveFeedbackCount
            negativeFeedbackCount
          }
        }
      }
    `({
      id: selectedArticleId,
    });

    // Track which Article is selected by user.
    ga(userId, { ec: 'Article', ea: 'Selected', el: selectedArticleId });

    const count = {};

    GetArticle.articleReplies.forEach(ar => {
      // Track which Reply is searched. And set tracking event as non-interactionHit.
      ga(userId, { ec: 'Reply', ea: 'Search', el: ar.reply.id }, true);

      const type = ar.reply.type;
      if (!count[type]) {
        count[type] = 1;
      } else {
        count[type]++;
      }
    });

    const articleReplies = reorderArticleReplies(GetArticle.articleReplies);
    const summary =
      '這個訊息有：\n' +
      `${count.RUMOR || 0} 則回應標成 ❌ 含有不實訊息\n` +
      `${count.NOT_RUMOR || 0} 則回應標成 ⭕ 含有真實訊息\n` +
      `${count.OPINIONATED || 0} 則回應標成 💬 含有個人意見\n` +
      `${count.NOT_ARTICLE || 0} 則回應標成 ⚠️️ 不在查證範圍\n`;

    replies = [
      {
        type: 'text',
        text: summary,
      },
    ];

    if (articleReplies.length !== 0) {
      data.foundReplyIds = articleReplies.map(({ reply }) => reply.id);

      state = 'CHOOSING_REPLY';

      if (articleReplies.length === 1) {
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

      replies.push({
        type: 'template',
        altText: createAltText(articleReplies),
        template: {
          type: 'carousel',
          columns: articleReplies
            .slice(0, 10)
            .map(
              (
                { reply, positiveFeedbackCount, negativeFeedbackCount },
                idx
              ) => ({
                text: createTypeWords(reply.type) +
                  '\n' +
                  createFeedbackWords(
                    positiveFeedbackCount,
                    negativeFeedbackCount
                  ) +
                  '\n' +
                  reply.text.slice(0, 80),
                actions: [createPostbackAction('閱讀此回應', idx + 1, issuedAt)],
              })
            ),
        },
      });

      if (articleReplies.length > 10) {
        replies.push({
          type: 'text',
          text: `更多回應請到：${getArticleURL(selectedArticleId)}`,
        });
      }
    } else {
      // No one has replied to this yet.

      // Track not yet reply Articles.
      ga(userId, { ec: 'Article', ea: 'NoReply', el: selectedArticleId });

      const { data: { CreateReplyRequest }, errors } = await gql`
        mutation($id: String!) {
          CreateReplyRequest(articleId: $id) {
            replyRequestCount
          }
        }
      `({ id: selectedArticleId }, { userId });

      replies = [
        {
          type: 'text',
          text: `目前還沒有人回應這篇訊息唷。${errors ? '' : `已經將您的需求記錄下來了，共有 ${CreateReplyRequest.replyRequestCount} 人跟您一樣渴望看到針對這篇訊息的回應。`}`,
        },
        {
          type: 'text',
          text: `若有最新回應，會寫在這個地方：${getArticleURL(selectedArticleId)}`,
        },
      ];

      state = '__INIT__';
    }
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
