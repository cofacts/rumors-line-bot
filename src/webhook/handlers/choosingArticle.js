import { t } from 'ttag';
import gql from 'src/lib/gql';
import { getArticleURL, createTypeWords } from 'src/lib/sharedUtils';
import {
  createPostbackAction,
  createFeedbackWords,
  ellipsis,
  ManipulationError,
  createArticleSourceReply,
  POSTBACK_NO_ARTICLE_FOUND,
  createTextMessage,
  createCommentBubble,
  createNotificationSettingsBubble,
  createArticleShareBubble,
} from './utils';
import ga from 'src/lib/ga';
import UserSettings from 'src/database/models/userSettings';

import UserArticleLink from '../../database/models/userArticleLink';
import choosingReply from '../handlers/choosingReply';

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
  let { data, state, event, userId, replies } = params;

  if (event.type !== 'postback' && event.type !== 'server_choose') {
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

    const inputSummary = ellipsis(data?.searchedText, 12);
    return {
      data,
      event,
      userId,
      replies: [
        createTextMessage({
          text:
            t`I am sorry you cannot find the information “${inputSummary}” you are looking for. But I would still like to help.` +
            '\n' +
            t`May I ask you a quick question?`,
        }),
        createArticleSourceReply(data.sessionId),
      ],
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

    // choose reply for user
    event = {
      type: 'server_choose',
      input: articleReplies[0].reply.id,
    };

    return await choosingReply({
      data,
      state: 'CHOOSING_REPLY',
      event,
      userId,
      replies: [],
    });
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
      t`Volunteer editors have published several replies to this message.` +
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
    const articleUrl = getArticleURL(selectedArticleId);
    const { allowNewReplyUpdate } = await UserSettings.findOrInsertByUserId(
      userId
    );
    replies = [
      {
        type: 'flex',
        altText: t`This message has already published on Cofacts, and will soon be fact-checked by volunteers.
Don’t trust the message just yet!`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                wrap: true,
                text: t`This message has already published on Cofacts, and will soon be fact-checked by volunteers.
Don’t trust the message just yet!`,
              },
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: t`View reported message`,
                  uri: articleUrl,
                },
                margin: 'md',
              },
            ],
          },
        },
      },
      createTextMessage({ text: t`In the meantime, you can:` }),
      {
        type: 'flex',
        altText: t`Provide more detail`,
        contents: {
          type: 'carousel',
          contents: [
            createCommentBubble(selectedArticleId),

            // Ask user to turn on notification if the user did not turn it on
            //
            process.env.NOTIFY_METHOD &&
              !allowNewReplyUpdate &&
              createNotificationSettingsBubble(),

            createArticleShareBubble(articleUrl),
          ].filter(m => m),
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

  return { data, event, userId, replies };
}
