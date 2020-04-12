import { t } from 'ttag';
import gql from 'src/lib/gql';
import { getArticleURL } from 'src/lib/sharedUtils';
import {
  createPostbackAction,
  createFeedbackWords,
  createTypeWords,
  ellipsis,
  ManipulationError,
  createAskArticleSubmissionConsentReply,
  POSTBACK_NO_ARTICLE_FOUND,
} from './utils';
import ga from 'src/lib/ga';

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

export default async function choosingArticle(params) {
  let { data, state, event, userId, replies, isSkipUser } = params;

  if (event.type !== 'postback') {
    throw new ManipulationError(t`Please choose from provided options.`);
  }

  if (event.input === POSTBACK_NO_ARTICLE_FOUND) {
    ga(userId, state, data.searchedText)
      .event({
        ec: 'UserInput',
        ea: 'ArticleSearch',
        el: 'ArticleFoundButNoHit',
      })
      .send();

    return {
      data,
      state: 'ASKING_ARTICLE_SUBMISSION_CONSENT',
      event,
      userId,
      replies: [createAskArticleSubmissionConsentReply(userId, data.sessionId)],
      isSkipUser,
    };
  }

  const selectedArticleId = (data.selectedArticleId = event.input);

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

  // Store it so that other handlers can use
  data.selectedArticleText = GetArticle.text;

  const visitor = ga(userId, state, data.selectedArticleText);

  // Track which Article is selected by user.
  visitor.event({
    ec: 'Article',
    ea: 'Selected',
    el: selectedArticleId,
  });

  const articleReplies = reorderArticleReplies(GetArticle.articleReplies);
  if (articleReplies.length === 1) {
    // choose for user
    event.input = 1;

    visitor.send();
    return {
      data,
      state: 'CHOOSING_REPLY',
      event: {
        type: 'postback',
        input: articleReplies[0].reply.id,
      },
      userId,
      replies,
      isSkipUser: true,
    };
  }

  if (articleReplies.length !== 0) {
    const countOfType = {};
    articleReplies.forEach(ar => {
      // Track which Reply is searched. And set tracking event as non-interactionHit.
      visitor.event({ ec: 'Reply', ea: 'Search', el: ar.reply.id, ni: true });

      const type = ar.reply.type;
      countOfType[type] = (countOfType[type] || 0) + 1;
    });

    const summary =
      t`Volunteer editors has publised several replies to this message.` +
      '\n\n👨‍👩‍👧‍👦 ' +
      [
        countOfType.RUMOR > 0
          ? t`${countOfType.RUMOR} of them say it ❌ contains misinformation.`
          : '',
        countOfType.NOT_RUMOR > 0
          ? t`${
              countOfType.NOT_RUMOR
            } of them says it ⭕ contains true information.`
          : '',
        countOfType.OPINIONATED > 0
          ? t`${
              countOfType.OPINIONATED
            } of them says it 💬 contains personal perspective.`
          : '',
        countOfType.NOT_ARTICLE > 0
          ? t`${
              countOfType.NOT_ARTICLE
            } of them says it ⚠️️ is out of scope of Cofacts.`
          : '',
      ]
        .filter(s => s)
        .join('\n');

    const replyOptions = articleReplies
      .slice(0, 10)
      .map(({ reply, positiveFeedbackCount, negativeFeedbackCount }, idx) => {
        const typeWords = createTypeWords(reply.type).toLowerCase();
        return {
          type: 'bubble',
          direction: 'ltr',
          header: {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            paddingBottom: 'none',
            contents: [
              {
                type: 'text',
                text: '💬',
                flex: 0,
              },
              {
                type: 'text',
                text: t`Someone thinks it ${typeWords}`,
                gravity: 'center',
                size: 'sm',
                weight: 'bold',
                wrap: true,
                color: '#AAAAAA',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: ellipsis(reply.text, 300, '...'), // 50KB for entire Flex carousel
                align: 'start',
                wrap: true,
                margin: 'md',
                maxLines: 10,
              },
              {
                type: 'filler',
              },
              {
                type: 'separator',
                margin: 'md',
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: createFeedbackWords(
                      positiveFeedbackCount,
                      negativeFeedbackCount
                    ),
                    size: 'xs',
                    wrap: true,
                  },
                ],
                margin: 'md',
                spacing: 'none',
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                action: createPostbackAction(
                  `👀 ${t`Take a look`}`,
                  idx + 1,
                  data.sessionId
                ),
                style: 'primary',
              },
            ],
          },
        };
      });

    replies = [
      {
        type: 'text',
        text: summary,
      },
      {
        type: 'text',
        text: t`Let's pick one` + ' 👇',
      },
      {
        type: 'flex',
        altText: t`Please take a look at the following replies.`,
        contents: {
          type: 'carousel',
          contents: replyOptions,
        },
      },
    ];

    if (articleReplies.length > 10) {
      const articleUrl = getArticleURL(selectedArticleId);
      replies.push({
        type: 'text',
        text: t`Visit ${articleUrl} for more replies.`,
      });
    }

    state = 'CHOOSING_REPLY';
  } else {
    // No one has replied to this yet.

    // Track not yet reply Articles.
    visitor.event({
      ec: 'Article',
      ea: 'NoReply',
      el: selectedArticleId,
    });

    const altText =
      '抱歉這篇訊息還沒有人回應過唷！\n' +
      '\n' +
      '請問您是從哪裡看到這則訊息呢？\n' +
      '\n' +
      data.articleSources
        .map((option, index) => `${option} > 請傳 ${index + 1}\n`)
        .join('') +
      '\n' +
      '請按左下角「⌨️」鈕輸入選項編號。';

    replies = [
      {
        type: 'template',
        altText,
        template: {
          type: 'buttons',
          text:
            '抱歉這篇訊息還沒有人回應過唷！\n請問您是從哪裡看到這則訊息呢？',
          actions: data.articleSources.map((option, index) =>
            createPostbackAction(option, index + 1, issuedAt)
          ),
        },
      },
    ];

    // Submit article replies early, no need to wait for the request
    gql`
      mutation SubmitReplyRequestWithoutReason($id: String!) {
        CreateOrUpdateReplyRequest(articleId: $id) {
          replyRequestCount
        }
      }
    `({ id: selectedArticleId }, { userId });

    state = 'ASKING_REPLY_REQUEST_REASON';
  }

  visitor.send();

  return { data, state, event, userId, replies, isSkipUser };
}
