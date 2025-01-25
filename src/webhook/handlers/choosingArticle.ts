import { t } from 'ttag';
import gql from 'src/lib/gql';
import { getArticleURL, createTypeWords, format } from 'src/lib/sharedUtils';
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
  createAskArticleSubmissionConsentReply,
  createAIReply,
} from './utils';
import ga from 'src/lib/ga';
import UserSettings from 'src/database/models/userSettings';
import {
  GetArticleInChoosingArticleQuery,
  GetArticleInChoosingArticleQueryVariables,
  ReplyTypeEnum,
  SubmitReplyRequestWithoutReasonMutation,
  SubmitReplyRequestWithoutReasonMutationVariables,
} from 'typegen/graphql';

import UserArticleLink from '../../database/models/userArticleLink';
import choosingReply from './choosingReply';
import type { Input as ChoosingReplyInput } from './choosingReply';
import { ChatbotPostbackHandler } from 'src/types/chatbotState';
import { FlexBubble, Message } from '@line/bot-sdk';
import { addDays, isBefore } from 'date-fns';

/**
 * 第2句 (template message)：按照時間排序「不在查證範圍」之外的回應，每則回應第一行是
 * 「⭕ 含有真實訊息」或「❌ 含有不實訊息」之類的 (含 emoticon)，然後是回應文字。如果
 * 還有空間，才放「不在查證範圍」的回應。最後一句的最後一格顯示「看其他回應」，連到網站。
 */
function reorderArticleReplies(
  articleReplies: NonNullable<
    GetArticleInChoosingArticleQuery['GetArticle']
  >['articleReplies']
) {
  const replies = [];
  const notArticleReplies = [];

  for (const articleReply of articleReplies ?? []) {
    const reply = articleReply?.reply;
    if (!reply) continue; // Make Typescript happy
    if (reply.type !== 'NOT_ARTICLE') {
      replies.push(articleReply);
    } else {
      notArticleReplies.push(articleReply);
    }
  }
  return replies.concat(notArticleReplies);
}

// https://developers.line.biz/en/reference/messaging-api/#template-messages

const choosingArticle: ChatbotPostbackHandler = async (params) => {
  const {
    context,
    userId,
    postbackData: { input: selectedArticleId, state, sessionId },
  } = params;

  // Input should be article ID, which is a string
  if (typeof selectedArticleId !== 'string') {
    throw new ManipulationError(t`Please choose from provided options.`);
  }

  // POSTBACK_NO_ARTICLE_FOUND is only available when context.msgs contain 1 message
  //
  if (selectedArticleId === POSTBACK_NO_ARTICLE_FOUND) {
    const firstMsg = context.msgs[0];
    // istanbul ignore if
    if (!firstMsg) {
      throw new Error('firstMsg is undefined'); // Should never happen
    }
    const visitor = ga(
      userId,
      state,
      'text' in firstMsg ? firstMsg.text : firstMsg.id
    );
    visitor.event({
      ec: 'UserInput',
      ea: 'ArticleSearch',
      el: 'ArticleFoundButNoHit',
    });
    visitor.send();

    if (firstMsg.type === 'text') {
      const inputSummary = ellipsis(firstMsg.text, 12);
      return {
        context,
        replies: [
          createTextMessage({
            text:
              t`I am sorry you cannot find the information “${inputSummary}” you are looking for. But I would still like to help.` +
              '\n' +
              t`May I ask you a quick question?`,
          }),
          createArticleSourceReply(context.sessionId),
        ],
      };
    }
    return {
      context,
      replies: [
        createTextMessage({
          text:
            t`I am sorry you cannot find the information you are looking for.` +
            '\n' +
            t`Do you want someone to fact-check this message?`,
        }),
        createAskArticleSubmissionConsentReply(context.sessionId),
      ],
    };
  }

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
    query GetArticleInChoosingArticle($id: String!) {
      GetArticle(id: $id) {
        text
        replyCount
        articleType
        articleReplies(status: NORMAL) {
          reply {
            id
            type
            text
          }
          positiveFeedbackCount
          negativeFeedbackCount
        }
        createdAt
      }
    }
  `<
    GetArticleInChoosingArticleQuery,
    GetArticleInChoosingArticleQueryVariables
  >({
    id: selectedArticleId,
  });

  if (!GetArticle) {
    throw new ManipulationError(t`Provided message is not found.`);
  }

  const selectedArticleText = GetArticle.text ?? '';

  const visitor = ga(userId, state, selectedArticleText);

  // Track which Article is selected by user.
  visitor.event({
    ec: 'Article',
    ea: 'Selected',
    el: selectedArticleId,
  });

  const articleReplies = reorderArticleReplies(GetArticle.articleReplies);
  if (articleReplies.length === 1) {
    visitor.send();

    const input: ChoosingReplyInput = {
      a: selectedArticleId,
      r: articleReplies[0].reply?.id ?? '',
    };

    // choose reply for user
    return await choosingReply({
      context,
      postbackData: {
        sessionId,
        state: 'CHOOSING_REPLY',
        input,
      },
      userId,
    });
  }

  let replies: Message[] = [];

  if (articleReplies.length !== 0) {
    const countOfType: Record<ReplyTypeEnum, number> = {
      RUMOR: 0,
      NOT_RUMOR: 0,
      NOT_ARTICLE: 0,
      OPINIONATED: 0,
    };
    articleReplies.forEach((ar) => {
      /* istanbul ignore if */
      if (!ar.reply?.type) return;

      // Track which Reply is searched. And set tracking event as non-interactionHit.
      visitor.event({ ec: 'Reply', ea: 'Search', el: ar.reply.id, ni: true });

      const type = ar.reply.type;
      countOfType[type] += 1;
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
          ? t`${countOfType.NOT_RUMOR} of them says it ⭕ contains true information.`
          : '',
        countOfType.OPINIONATED > 0
          ? t`${countOfType.OPINIONATED} of them says it 💬 contains personal perspective.`
          : '',
        countOfType.NOT_ARTICLE > 0
          ? t`${countOfType.NOT_ARTICLE} of them says it ⚠️️ is out of scope of Cofacts.`
          : '',
      ]
        .filter((s) => s)
        .join('\n');

    const replyOptions = articleReplies
      .slice(0, 10)
      .map(
        ({
          reply,
          positiveFeedbackCount,
          negativeFeedbackCount,
        }): FlexBubble | undefined => {
          /* istanbul ignore if */
          if (!reply) return;

          const typeWords = createTypeWords(reply.type).toLowerCase();
          const displayTextWhenChosen = ellipsis(reply.text ?? '', 25);

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
                  text: ellipsis(reply.text ?? '', 300, '...'), // 50KB for entire Flex carousel
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
                    { a: selectedArticleId, r: reply.id },
                    t`I choose “${displayTextWhenChosen}”`,
                    context.sessionId,
                    'CHOOSING_REPLY'
                  ),
                  style: 'primary',
                  color: '#ffb600',
                },
              ],
            },
          };
        }
      )
      .filter(Boolean);

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
    const isTextArticle = GetArticle.articleType === 'TEXT';

    let maybeAIReplies: Message[] = [
      createTextMessage({
        text: t`In the meantime, you can:`,
      }),
    ];

    if (isTextArticle) {
      const aiReply = await createAIReply(selectedArticleId, userId);

      if (aiReply) {
        const articleCreatedAt = new Date(
          GetArticle.createdAt ?? -Infinity /* Triggers invalid date */
        );
        const aiReplyCreatedAt = new Date(aiReply.createdAt);

        const aiReplyWithin30Days = isBefore(
          aiReplyCreatedAt,
          addDays(articleCreatedAt, 30)
        );

        const articleCreatedAtStr = format(articleCreatedAt);
        const aiReplyCreatedAtStr = aiReplyWithin30Days
          ? '當時'
          : `${format(aiReplyCreatedAt)}時`;

        maybeAIReplies = [
          createTextMessage({
            text: `這則訊息首次回報於 ${articleCreatedAtStr} ，尚待查核，請先不要相信這篇文章。\n以下是${aiReplyCreatedAtStr}機器人初步分析此訊息的結果，希望能帶給你一些想法。`,
          }),
          aiReply,
          createTextMessage({
            text: t`After reading the automatic analysis by the bot above, you can:`,
          }),
        ];
      }
    }

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
      ...maybeAIReplies,
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
          ].filter(Boolean),
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
    `<
      SubmitReplyRequestWithoutReasonMutation,
      SubmitReplyRequestWithoutReasonMutationVariables
    >({ id: selectedArticleId }, { userId });
  }

  visitor.send();

  return { context, replies };
};

export default choosingArticle;
