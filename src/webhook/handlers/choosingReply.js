import { t } from 'ttag';
import gql from 'src/lib/gql';
import { getArticleURL } from 'src/lib/sharedUtils';
import {
  createReferenceWords,
  createTypeWords,
  ellipsis,
  getLIFFURL,
  ManipulationError,
  FLEX_MESSAGE_ALT_TEXT,
} from './utils';
import ga from 'src/lib/ga';

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

  const articleUrl = getArticleURL(data.selectedArticleId);
  const typeStr = createTypeWords(GetReply.type).toLocaleLowerCase();
  const helpfulTitle = t`Is the reply helpful?`;

  replies = [
    {
      type: 'text',
      text: `💡 ${t`Someone on the internet replies to the message:`}`,
    },
    {
      type: 'text',
      text: ellipsis(GetReply.text, 2000),
    },
    {
      type: 'text',
      text: ellipsis(createReferenceWords(GetReply), 2000),
    },
    {
      type: 'text',
      text:
        `⬆️ ${t`Therefore, the author think the message ${typeStr}.`}\n\n` +
        `💁 ${t`These messages are provided by some nice volunteers. Please refer to their references and make judgements on your own.`}\n` +
        (GetArticle.replyCount > 1
          ? `🗣️ ${t`There are different replies for the message. Read them all here before making judgements:`}\n${articleUrl}\n`
          : '') +
        `\n⁉️ ${t`If you have different thoughts, you may have your say here:`}\n${articleUrl}`,
    },
    {
      type: 'flex',
      altText: helpfulTitle + '\n' + FLEX_MESSAGE_ALT_TEXT,
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
    },
  ];

  const visitor = ga(userId, state, data.selectedArticleText);
  // Track when user select a reply.
  visitor.event({ ec: 'Reply', ea: 'Selected', el: selectedReplyId });
  // Track which reply type reply to user.
  visitor.event({ ec: 'Reply', ea: 'Type', el: GetReply.type, ni: true });
  visitor.send();

  return { data, event, issuedAt, userId, replies, isSkipUser };
}
