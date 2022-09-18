import { t } from 'ttag';
import gql from 'src/lib/gql';
import {
  ManipulationError,
  createNotificationSettingsBubble,
  createReplyMessages,
  ellipsis,
} from './utils';
import { getArticleURL, createTypeWords } from 'src/lib/sharedUtils';
import ga from 'src/lib/ga';
import UserSettings from 'src/database/models/userSettings';

/**
 * @param {string} articleId - Article ID of the article-reply to feedback
 * @param {string} replyId - Reply ID of the article-reply to feedback
 * @returns {object} Flex message bubble object that asks the user if reply is helpful
 */
function createAskReplyFeedbackBubble(articleId, replyId) {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      paddingAll: 'xl',
      contents: [
        {
          type: 'text',
          wrap: true,
          text: t`Is the reply helpful?`,
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#00B172',
          action: {
            type: 'uri',
            label: '👍 ' + t`Yes`,
            uri: `${
              process.env.LIFF_URL
            }?p=feedback&articleId=${articleId}&replyId=${replyId}&vote=UPVOTE`,
          },
        },
        {
          type: 'button',
          style: 'primary',
          color: '#FB5959',
          action: {
            type: 'uri',
            label: '😕 ' + t`No`,
            uri: `${
              process.env.LIFF_URL
            }?p=feedback&articleId=${articleId}&replyId=${replyId}&vote=DOWNVOTE`,
          },
        },
      ],
    },
  };
}

/**
 * @param {string} articleId - article ID to share
 * @param {string} fullArticleText - article text
 * @param {ReplyTypeEnum} replyTypeEnumValue - reply's type enum
 * @returns Flex message bubble object that asks user to share
 */
function createShareBubble(articleId, fullArticleText, replyTypeEnumValue) {
  const articleUrl = getArticleURL(articleId);
  const articleText = ellipsis(fullArticleText, 15);
  const replyType = createTypeWords(replyTypeEnumValue).toLowerCase();
  const sharedText = t`Someone says the message “${articleText}” ${replyType}.\n\nPlease refer to ${articleUrl} for more information, replies and references.`;
  return {
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
          text: t`Don't forget to forward the messages above to others and share with them!`,
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#ffb600',
          action: {
            type: 'uri',
            label: t`Share to friends`,
            uri: `https://line.me/R/msg/text/?${encodeURI(sharedText)}`,
          },
        },
        {
          type: 'button',
          style: 'link',
          color: '#ffb600',
          action: {
            type: 'uri',
            label: t`Provide better reply`,
            uri: getArticleURL(articleId),
          },
        },
      ],
    },
  };
}

export default async function choosingReply(params) {
  let { data, state, event, issuedAt, userId, replies } = params;

  if (event.type !== 'postback' && event.type !== 'server_choose') {
    throw new ManipulationError(t`Please choose from provided options.`);
  }

  const selectedReplyId = (data.selectedReplyId = event.input);

  const { data: getReplyData, errors } = await gql`
    query GetReplyRelatedData($id: String!, $articleId: String!) {
      GetReply(id: $id) {
        type
        text
        reference
        createdAt
      }
      GetArticle(id: $articleId) {
        replyCount
      }
    }
  `({ id: selectedReplyId, articleId: data.selectedArticleId });

  if (errors) {
    throw new ManipulationError(
      t`We have problem retrieving message and reply data, please forward the message again`
    );
  }

  const { GetReply, GetArticle } = getReplyData;
  const { allowNewReplyUpdate } = await UserSettings.findOrInsertByUserId(
    userId
  );

  replies = [
    ...createReplyMessages(GetReply, GetArticle, data.selectedArticleId),
    {
      type: 'flex',
      altText: t`Is the reply helpful?`,
      contents: {
        type: 'carousel',
        contents: [
          createAskReplyFeedbackBubble(data.selectedArticleId, selectedReplyId),

          // Ask user to turn on notification if the user did not turn it on
          process.env.NOTIFY_METHOD &&
            !allowNewReplyUpdate &&
            createNotificationSettingsBubble(),

          createShareBubble(
            data.selectedArticleId,
            data.selectedArticleText,
            GetReply.type
          ),
        ].filter(m => m),
      },
    },
  ];

  const visitor = ga(userId, state, data.selectedArticleText);
  // Track when user select a reply.
  visitor.event({ ec: 'Reply', ea: 'Selected', el: selectedReplyId });
  // Track which reply type reply to user.
  visitor.event({ ec: 'Reply', ea: 'Type', el: GetReply.type, ni: true });
  visitor.send();

  return { data, event, issuedAt, userId, replies };
}
