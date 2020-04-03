import { t } from 'ttag';
import gql from '../../lib/gql';
import {
  createPostbackAction,
  createReferenceWords,
  createTypeWords,
  ellipsis,
  getArticleURL,
  getLIFFURL,
  DOWNVOTE_PREFIX,
} from './utils';
import ga from '../../lib/ga';

export default async function choosingReply(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.foundReplyIds) {
    throw new Error('foundReplyIds not set in data');
  }

  const visitor = ga(userId, state, data.selectedArticleText);

  const selectedReplyId = data.foundReplyIds[event.input - 1];

  if (!selectedReplyId) {
    replies = [
      {
        type: 'text',
        text: `請輸入 1～${data.foundReplyIds.length} 的數字，來選擇回應。`,
      },
    ];

    state = 'CHOOSING_REPLY';
  } else {
    const {
      data: { GetReply },
    } = await gql`
      query($id: String!) {
        GetReply(id: $id) {
          type
          text
          reference
          createdAt
        }
      }
    `({ id: selectedReplyId });

    const articleUrl = getArticleURL(data.selectedArticleId);
    const typeStr = createTypeWords(GetReply.type).toLocaleLowerCase();

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
          (data.foundReplyIds.length > 1
            ? `🗣️ ${t`There are different replies for the message. Read them all here before making judgements:`}\n${articleUrl}\n`
            : '') +
          `\n⁉️ ${t`If you have different thoughts, you may have your say here:`}\n${articleUrl}`,
      },
      {
        type: 'template',
        altText:
          '請問上面回應是否有幫助？\n「是」請輸入「y」，「否」請至手機上回應',
        template: {
          type: 'confirm',
          text: t`Is the reply helpful?`,
          actions: [
            createPostbackAction(t`Yes`, 'y', issuedAt),
            {
              type: 'uri',
              label: t`No`,
              uri: getLIFFURL(
                'ASKING_REPLY_FEEDBACK',
                GetReply.text,
                DOWNVOTE_PREFIX,
                issuedAt
              ),
            },
          ],
        },
      },
    ];
    // Track when user select a reply.
    visitor.event({ ec: 'Reply', ea: 'Selected', el: selectedReplyId });
    // Track which reply type reply to user.
    visitor.event({ ec: 'Reply', ea: 'Type', el: GetReply.type, ni: true });

    data.selectedReplyId = selectedReplyId;
    state = 'ASKING_REPLY_FEEDBACK';
  }

  visitor.send();
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
