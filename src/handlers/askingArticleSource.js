import {
  REASON_PREFIX,
  getLIFFURL,
  createAskArticleSubmissionReply,
  ellipsis,
} from './utils';
import ga from '../ga';

export default async function askingArticleSource(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  const visitor = ga(userId, state, data.selectedArticleText);
  // Track the source of the new message.
  visitor.event({ ec: 'Article', ea: 'ProvidingSource', el: event.input });
  if (
    event.input.indexOf('自己輸入') !== -1 ||
    event.input.indexOf('自己打') !== -1
  ) {
    replies = [
      {
        type: 'template',
        altText:
          '好的，建議您把訊息轉傳給 MyGoPen 或蘭姆酒吐司，兩個都是很專業的謠言破解網站，而且有 💁 專人為您解答喔！',
        template: {
          type: 'confirm',
          text:
            '好的，建議您把訊息轉傳給 MyGoPen 或蘭姆酒吐司，兩個都是很專業的謠言破解網站，而且有 💁 專人為您解答喔！',
          actions: [
            {
              type: 'uri',
              label: 'MyGoPen',
              uri: `line://ti/p/%40mygopen`,
            },
            {
              type: 'uri',
              label: '蘭姆酒吐司',
              uri: `line://ti/p/1q14ZZ8yjb`,
            },
          ],
        },
      },
    ];

    state = '__INIT__';
  } else if (data.foundArticleIds && data.foundArticleIds.length > 0) {
    const altText =
      '【跟編輯說您的疑惑】\n' +
      '好的，謝謝您。若您覺得這是一則謠言，請指出您有疑惑之處，說服編輯這是一份應該被闢謠的訊息。\n' +
      '\n' +
      '請按左下角「⌨️」鈕，把「為何您會覺得這是一則謠言」的理由傳給我們，幫助闢謠編輯釐清您的疑惑；\n' +
      '若想跳過，請輸入「n」。';

    replies = [
      {
        type: 'flex',
        altText,
        contents: {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: '跟編輯說您的疑惑',
                weight: 'bold',
                color: '#009900',
                size: 'sm',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'md',
            contents: [
              {
                type: 'text',
                text:
                  '好的，謝謝您。若您希望闢謠的好心人可以關注這一篇，請按「我也想知道」告訴大家你的想法。',
                wrap: true,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'button',
                style: 'primary',
                action: {
                  type: 'uri',
                  label: '🙋 我也想知道',
                  uri: getLIFFURL(
                    'ASKING_REPLY_REQUEST_REASON',
                    data.searchedText,
                    REASON_PREFIX,
                    issuedAt
                  ),
                },
              },
            ],
          },
        },
      },
    ];

    state = 'ASKING_REPLY_REQUEST_REASON';
  } else {
    replies = [
      {
        type: 'text',
        text: '好的，謝謝您。',
      },
    ].concat(
      createAskArticleSubmissionReply(
        'ASKING_ARTICLE_SUBMISSION_REASON',
        ellipsis(data.searchedText, 12),
        REASON_PREFIX,
        issuedAt
      )
    );
    state = 'ASKING_ARTICLE_SUBMISSION_REASON';
  }
  visitor.send();
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
