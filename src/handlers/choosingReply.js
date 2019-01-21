import gql from '../gql';
import {
  createPostbackAction,
  createReferenceWords,
  createTypeWords,
  ellipsis,
  getArticleURL,
  getLIFFURL,
  DOWNVOTE_PREFIX,
} from './utils';
import ga from '../ga';

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

    replies = [
      {
        type: 'text',
        text: `💡 網路上有人這樣回應這則訊息：`,
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
        text: `⬆️ 綜合以上，回應者認為它${createTypeWords(
          GetReply.type
        )}。\n\n💁 以上資訊由好心人提供。請斟酌出處與理由思考判斷。\n${
          data.foundReplyIds.length > 1
            ? `🗣️ 這則訊息有很多不同回應，建議到這裡一次讀完再下判斷：\n${articleUrl}\n`
            : ''
        }\n⁉️ 如果你對這則訊息有不同看法，歡迎到下面這裡寫入新的回應：\n${articleUrl}`,
      },
      {
        type: 'template',
        altText:
          '請問上面回應是否有幫助？\n「是」請輸入「y」，「否」請至手機上回應',
        template: {
          type: 'confirm',
          text: '請問上面回應是否有幫助？',
          actions: [
            createPostbackAction('是', 'y', issuedAt),
            {
              type: 'uri',
              label: '否',
              uri: getLIFFURL(
                'ASKING_REPLY_FEEDBACK',
                ellipsis(GetReply.text, 10),
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
