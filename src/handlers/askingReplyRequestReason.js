import gql from '../gql';
import { getArticleURL, REASON_PREFIX } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;
  const { selectedArticleId } = data;

  if (!event.input.startsWith(REASON_PREFIX)) {
    replies = [
      {
        type: 'text',
        text: '請點擊上面的「我也想知道」，或放棄這則，改轉傳其他訊息。',
      },
    ];
  } else {
    const reason = event.input.slice(REASON_PREFIX.length);

    const {
      data: { CreateReplyRequest },
    } = await gql`
      mutation($id: String!, $reason: String) {
        CreateReplyRequest(articleId: $id, reason: $reason) {
          replyRequestCount
        }
      }
    `({ id: selectedArticleId, reason }, { userId });

    replies = [
      {
        type: 'text',
        text: `已經將您的需求記錄下來了，共有 ${
          CreateReplyRequest.replyRequestCount
        } 人跟您一樣渴望看到針對這篇訊息的回應。若有最新回應，會寫在這個地方：${getArticleURL(
          selectedArticleId
        )}`,
      },
    ];
    state = '__INIT__';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
