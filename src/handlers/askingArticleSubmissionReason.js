import ga from '../ga';
import gql from '../gql';
import { REASON_PREFIX, getArticleURL } from './utils';

export default async function askingArticleSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  const visitor = ga(userId, state, data.searchedText);

  if (!event.input.startsWith(REASON_PREFIX)) {
    replies = [
      {
        type: 'text',
        text:
          '請點擊上面的「送出按鈕」送出目前的訊息到資料庫，或轉傳其他訊息。',
      },
    ];
  } else {
    visitor.event({ ec: 'Article', ea: 'Create', el: 'Yes' });

    const reason = event.input.slice(REASON_PREFIX.length);
    const {
      data: { CreateArticle },
    } = await gql`
      mutation($text: String!, $reason: String!) {
        CreateArticle(text: $text, reason: $reason, reference: { type: LINE }) {
          id
        }
      }
    `({ text: data.searchedText, reason }, { userId });

    const articleUrl = getArticleURL(CreateArticle.id);

    replies = [
      {
        type: 'text',
        text: `您回報的訊息已經被收錄至：${articleUrl}`,
      },
      {
        type: 'template',
        altText: 'this is a buttons template',
        template: {
          type: 'buttons',
          actions: [
            {
              type: 'uri',
              label: '向 LINE 群組求救',
              uri: `line://msg/text/?${encodeURIComponent(
                `我收到這則訊息覺得怪怪的，請幫我看看這是真的還是假的：${articleUrl}`
              )}`,
            },
            {
              type: 'uri',
              label: '問問臉書大神',
              uri: `https://www.facebook.com/dialog/share?openExternalBrowser=1&app_id=${
                process.env.FACEBOOK_APP_ID
              }&display=popup&quote=QAQAQ&href=${articleUrl}`,
            },
          ],
          title: '🙏 Call out 向朋友求救',
          text:
            '遠親不如近鄰。說不定你的朋友裡，就有能替你解惑的人唷！\n\n來向朋友們請教，這則訊息到底是真是假吧！',
        },
      },
    ];
    state = '__INIT__';
  }

  visitor.send();
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
