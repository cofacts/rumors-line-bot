import gql from '../gql';
import {
  createPostbackAction,
  createFeedbackWords,
  createTypeWords,
  isNonsenseText,
  getArticleURL,
  createAskArticleSubmissionReply,
  REASON_PLACEHOLDER,
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
      replies.unshift(articleReply); // FIXME: reverse order until API blocker is resolved in #78
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
      const prefix = `閱讀請傳 ${idx + 1}> ${createTypeWords(
        reply.type
      )}\n${createFeedbackWords(positiveFeedbackCount, negativeFeedbackCount)}`;
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
        text:
          '剛才您傳的訊息僅包含連結或是資訊太少，無從查證。\n' +
          '查證範圍請參考📖使用手冊 http://bit.ly/cofacts-line-users',
      },
    ];
    state = '__INIT__';
  } else if (doesNotContainMyArticle) {
    replies = createAskArticleSubmissionReply(issuedAt);

    state = 'ASKING_ARTICLE_SUBMISSION_REASON';
  } else if (!selectedArticleId) {
    replies = [
      {
        type: 'text',
        text: `請輸入 1～${data.foundArticleIds.length} 的數字，來選擇訊息。`,
      },
    ];

    state = 'CHOOSING_ARTICLE';
  } else {
    const {
      data: { GetArticle },
    } = await gql`
      query($id: String!) {
        GetArticle(id: $id) {
          text
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

    data.selectedArticleText = GetArticle.text;

    const visitor = ga(userId, data.selectedArticleText);
    visitor.screenview({ screenName: state });

    // Track which Article is selected by user.
    visitor.event(userId, {
      ec: 'Article',
      ea: 'Selected',
      el: selectedArticleId,
      dt: data.selectedArticleText,
    });

    const count = {};

    GetArticle.articleReplies.forEach(ar => {
      // Track which Reply is searched. And set tracking event as non-interactionHit.
      visitor.event({ ec: 'Reply', ea: 'Search', el: ar.reply.id, ni: true });

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

        visitor.send();
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
                text:
                  createTypeWords(reply.type) +
                  '\n' +
                  createFeedbackWords(
                    positiveFeedbackCount,
                    negativeFeedbackCount
                  ) +
                  '\n' +
                  reply.text.slice(0, 80),
                actions: [
                  createPostbackAction('閱讀此回應', idx + 1, issuedAt),
                ],
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
      visitor.event({
        ec: 'Article',
        ea: 'NoReply',
        el: selectedArticleId,
      });

      const altText =
        '【跟編輯說您的疑惑】\n' +
        '抱歉這篇訊息還沒有人回應過唷！\n' +
        '\n' +
        '若您覺得這是一則謠言，請指出您有疑惑之處，說服編輯這是一份應該被闢謠的訊息。\n' +
        '\n' +
        '請按左下角「⌨️」鈕，把「為何您會覺得這是一則謠言」的理由傳給我們，幫助闢謠編輯釐清您的疑惑；\n' +
        '若想跳過，請輸入「n」。';
      const accountId = process.env.LINE_AT_ID || 'cofacts';

      replies = [
        {
          type: 'flex',
          altText,
          contents: {
            type: 'bubble',
            header: {
              type: 'box',
              layout: 'horizontal',
              contents: [
                {
                  type: 'text',
                  text: '跟編輯說您的疑惑',
                  weight: 'bold',
                  color: '#009900',
                  size: 'sm',
                },
              ],
            },
            body: {
              type: 'box',
              layout: 'vertical',
              spacing: 'md',
              contents: [
                {
                  type: 'text',
                  text: '抱歉這篇訊息還沒有人回應過唷！',
                  wrap: true,
                  size: 'xxs',
                },
                {
                  type: 'text',
                  text:
                    '若您覺得這是一則謠言，請指出您有疑惑之處，說服編輯這是一份應該被闢謠的訊息，幫助闢謠編輯釐清您有疑惑之處。',
                  wrap: true,
                  size: 'xxs',
                },
                {
                  type: 'text',
                  text: '請打字告訴我們：',
                  weight: 'bold',
                  wrap: true,
                  color: '#990000',
                  size: 'md',
                },
                {
                  type: 'text',
                  text: '為何您會覺得這是一則謠言？',
                  weight: 'bold',
                  color: '#ff0000',
                  wrap: true,
                  size: 'xxl',
                },
              ],
            },
            footer: {
              type: 'box',
              layout: 'vertical',
              contents: [
                {
                  type: 'button',
                  action: createPostbackAction('我不想填理由', 'n', issuedAt),
                },
                {
                  type: 'button',
                  style: 'primary',
                  action: {
                    type: 'uri',
                    label: '⌨️ 傳理由給我們',
                    uri: `line://oaMessage/@${accountId}/?${REASON_PLACEHOLDER}`,
                  },
                },
              ],
            },
          },
        },
      ];

      state = 'ASKING_REPLY_REQUEST_REASON';
    }
    visitor.send();
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
