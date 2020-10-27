import { t } from 'ttag';
import gql from 'src/lib/gql';
import {
  getLIFFURL,
  ManipulationError,
  FLEX_MESSAGE_ALT_TEXT,
  createNotificationSettingsBubble,
  createReplyMessages,
} from './utils';
import ga from 'src/lib/ga';
import UserSettings from 'src/database/models/userSettings';

/**
 * @param {*} userId LINE user ID that does the input
 * @returns {object} Flex message object
 */
async function createAskReplyFeedbackMessage(userId) {
  const helpfulTitle = t`Is the reply helpful?`;
  const { allowNewReplyUpdate } = await UserSettings.findOrInsertByUserId(
    userId
  );

  return {
    type: 'flex',
    altText: helpfulTitle + '\n' + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            paddingAll: 'xl',
            contents: [
              {
                type: 'text',
                wrap: true,
                text: helpfulTitle,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'horizontal',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#ffb600',
                action: {
                  type: 'uri',
                  label: t`Yes`,
                  uri: getLIFFURL('feedback/yes', userId, data.sessionId),
                },
              },
              {
                type: 'button',
                style: 'primary',
                color: '#ffb600',
                action: {
                  type: 'uri',
                  label: t`No`,
                  uri: getLIFFURL('feedback/no', userId, data.sessionId),
                },
              },
            ],
          },
        },
        // Ask user to turn on notification if the user did not turn it on
        //
        process.env.NOTIFY_METHOD &&
          !allowNewReplyUpdate &&
          createNotificationSettingsBubble(),
      ].filter(m => m),
    },
  };
}

export default async function choosingReply(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (event.type !== 'postback') {
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

  replies = createReplyMessages(
    GetReply,
    GetArticle,
    data.selectedArticleId
  ).concat(await createAskReplyFeedbackMessage(userId));

  const visitor = ga(userId, state, data.selectedArticleText);
  // Track when user select a reply.
  visitor.event({ ec: 'Reply', ea: 'Selected', el: selectedReplyId });
  // Track which reply type reply to user.
  visitor.event({ ec: 'Reply', ea: 'Type', el: GetReply.type, ni: true });
  visitor.send();

  return { data, event, issuedAt, userId, replies, isSkipUser };
}
