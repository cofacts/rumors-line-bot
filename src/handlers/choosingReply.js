import gql from '../gql';
import {
  createPostbackAction,
  createReferenceWords,
  createTypeWords,
} from './utils';

export default async function choosingReply(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.foundReplyIds) {
    throw new Error('foundReplyIds not set in data');
  }

  const selectedReplyId = data.foundReplyIds[event.input - 1];

  if (!selectedReplyId) {
    replies = [
      { type: 'text', text: `請輸入 1～${data.foundReplyIds.length} 的數字，來選擇回應。` },
    ];

    state = 'CHOOSING_REPLY';
  } else {
    const { data: { GetReply } } = await gql`
      query($id: String!) {
        GetReply(id: $id) {
          type
          text
          reference
          createdAt
        }
      }
    `({ id: selectedReplyId });

    replies = [
      {
        type: 'text',
        text: `這則回應認為文章「${createTypeWords(GetReply.type)}」，理由為：`,
      },
      {
        type: 'text',
        text: GetReply.text.length >= 120
          ? GetReply.text.slice(0, 100) + '⋯⋯'
          : GetReply.text,
      },
      {
        type: 'text',
        text: createReferenceWords(GetReply.reference),
      },
      {
        type: 'template',
        altText: '請問這則回應是否有解答原文章？\n「是」請輸入「y」，「否」請輸入其他任何訊息。',
        template: {
          type: 'buttons',
          text: '請問這則回應是否有解答原文章？',
          actions: [
            createPostbackAction('是', 'y', issuedAt),
            createPostbackAction('否', 'n', issuedAt),
          ],
        },
      },
      {
        type: 'text',
        text: `您可以到以下網址閱讀其他回應：${process.env.SITE_URL}/article/${data.selectedArticleId}`,
      },
    ];

    data.selectedReplyId = selectedReplyId;
    state = 'ASKING_REPLY_FEEDBACK';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
