import gql from '../gql';
import { createPostbackAction, createReferenceWords } from './utils';

export default async function choosingReply(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.foundReplies) {
    throw new Error('foundReplies not set in data');
  }

  const selectedReply = data.foundReplies[event.input - 1];

  if (!selectedReply) {
    replies = [
      { type: 'text', text: `請輸入 1～${data.foundReplies.length} 的數字，來選擇回應。` },
    ];

    state = 'CHOOSING_REPLY';
  } else {
    const { data: { GetReply } } = await gql`
      query($id: String!) {
        GetReply(id: $id) {
          versions(limit: 1) {
            type
            text
            reference
            createdAt
          }
        }
      }
    `({ id: selectedReply.id });

    replies = [
      {
        type: 'text',
        text: `這則回應認為文章${GetReply.versions[0].type === 'RUMOR' ? '含有不實訊息' : '含有真實訊息'}，理由為：`,
      },
      {
        type: 'text',
        text: GetReply.versions[0].text.length >= 120
          ? GetReply.versions[0].text.slice(0, 100) + '⋯⋯'
          : GetReply.versions[0].text,
      },
      {
        type: 'text',
        text: createReferenceWords(GetReply.versions[0].reference),
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
        text: `可以到以下網址閱讀其他回應：${process.env.SITE_URL}/article/${data.selectedArticleId}`,
      },
    ];

    data.selectedReply = selectedReply;
    state = 'ASKING_REPLY_FEEDBACK';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
