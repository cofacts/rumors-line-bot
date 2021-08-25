import { t } from 'ttag';
import gql from 'src/lib/gql';
import { getArticleURL, createTypeWords } from 'src/lib/sharedUtils';
import {
  createPostbackAction,
  createFeedbackWords,
  ellipsis,
  ManipulationError,
  createAskArticleSubmissionConsentReply,
  POSTBACK_NO_ARTICLE_FOUND,
  FLEX_MESSAGE_ALT_TEXT,
  getLIFFURL,
} from './utils';
import ga from 'src/lib/ga';

import UserArticleLink from '../../database/models/userArticleLink';

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
    const visitor = ga(userId, state, data.searchedText);
    visitor.event({
      ec: 'UserInput',
      ea: 'ArticleSearch',
      el: 'ArticleFoundButNoHit',
    });
    visitor.send();

    return {
      data,
      event,
      userId,
      replies: [
        {
          type: 'text',
          text: t`I see. Don't trust the message just yet!
            May I have your help?`,
        },
        createAskArticleSubmissionConsentReply(userId, data.sessionId),
      ],
      isSkipUser,
    };
  }

  const selectedArticleId = (data.selectedArticleId = event.input);

  await UserArticleLink.createOrUpdateByUserIdAndArticleId(
    userId,
    selectedArticleId,
    {
      lastViewedAt: new Date(),
    }
  );

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

  if (!GetArticle) {
    throw new ManipulationError(t`Provided message is not found.`);
  }

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
    visitor.send();

    // choose for user
    return {
      data,
      event: {
        type: 'postback',
        input: articleReplies[0].reply.id,
      },
      userId,
      replies,
      // override state to 'CHOOSING_REPLY'
      state: 'CHOOSING_REPLY',
      // handleInput again
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
      '👨‍👩‍👧‍👦  ' +
      t`Volunteer editors has publised several replies to this message.` +
      '\n\n' +
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
      .map(({ reply, positiveFeedbackCount, negativeFeedbackCount }) => {
        const typeWords = createTypeWords(reply.type).toLowerCase();
        const displayTextWhenChosen = ellipsis(reply.text, 25);

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
                  reply.id,
                  t`I choose “${displayTextWhenChosen}”`,
                  data.sessionId,
                  'CHOOSING_REPLY'
                ),
                style: 'primary',
                color: '#ffb600',
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
  } else {
    // No one has replied to this yet.

    // Track not yet reply Articles.
    visitor.event({
      ec: 'Article',
      ea: 'NoReply',
      el: selectedArticleId,
    });

    const btnText = `ℹ️ ${t`Provide more info`}`;
    const spans = [
      {
        type: 'span',
        text: t`I would suggest don't trust this message just yet. To help Cofacts editors checking the message, please `,
      },
      {
        type: 'span',
        text: t`provide more information using the button below. `,
        color: '#ffb600',
        weight: 'bold',
      },
    ];

    replies = [
      {
        type: 'flex',
        altText: FLEX_MESSAGE_ALT_TEXT,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            paddingAll: 'lg',
            contents: [
              {
                type: 'text',
                wrap: true,
                contents: spans,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#ffb600',
                action: {
                  type: 'uri',
                  label: btnText,
                  uri: getLIFFURL('source', userId, data.sessionId),
                },
              },
            ],
          },
          styles: {
            body: {
              separator: true,
            },
          },
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
  }

  visitor.send();

  return { data, event, userId, replies, isSkipUser };
}
