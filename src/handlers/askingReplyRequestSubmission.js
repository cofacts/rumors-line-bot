import gql from '../gql';
import { getArticleURL } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;
  const { selectedArticleId } = data;

  if (!data.searchedText) {
    throw new Error('searchText not set in data');
  }

  if (event.input === 'y') {
    const reason = data.reasonText;

    const {
      data: { CreateReplyRequest },
    } = await gql`
      mutation($id: String!, reason: String) {
        CreateReplyRequest(articleId: $id, reason: $reason) {
          replyRequestCount
        }
      }
    `({ id: selectedArticleId, reason }, { userId });

    replies = [
      {
        type: 'text',
        text: `已經將您的需求以及理由記錄下來了，共有 ${
          CreateReplyRequest.replyRequestCount
        } 人跟您一樣渴望看到針對這篇訊息的回應。若有最新回應，會寫在這個地方：${getArticleURL(
          selectedArticleId
        )}`,
      },
    ];
    state = '__INIT__';
  } else if (event.input === 'n') {
    const {
      data: { CreateReplyRequest },
    } = await gql`
      mutation($id: String!) {
        CreateReplyRequest(articleId: $id) {
          replyRequestCount
        }
      }
    `({ id: selectedArticleId }, { userId });

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
  } else if (event.input === 'r') {
    replies = [{ type: 'text', text: '好的，請重新填寫理由。' }];
    state = 'ASKING_REPLY_REQUEST_REASON';
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
