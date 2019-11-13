import { t, msgid, ngettext } from 'ttag';
import GraphemeSplitter from 'grapheme-splitter';
const splitter = new GraphemeSplitter();

export function createPostbackAction(label, input, issuedAt) {
  return {
    type: 'postback',
    label,
    data: JSON.stringify({
      input,
      issuedAt,
    }),
  };
}

/**
 * @param {number} positive - Count of positive feedbacks
 * @param {number} negative - Count of negative feedbacks
 * @return {string} Description of feedback counts
 */
export function createFeedbackWords(positive, negative) {
  if (positive + negative === 0) return `[${t`No feedback yet`}]`;
  let result = '';
  if (positive)
    result +=
      ngettext(
        msgid`${positive} user considers this helpful`,
        `${positive} users consider this helpful`,
        positive
      ) + '\n';
  if (negative)
    result +=
      ngettext(
        msgid`${negative} user consider this not useful`,
        `${negative} users consider this not useful`,
        negative
      ) + '\n';
  return `[${result.trim()}]`;
}

/**
 * @param {string} text - The text to show in flex message, text type
 * @return {string} The truncated text
 */
export function createFlexMessageText(text = '') {
  // Actually the upper limit is 2000, but 100 should be enough
  // because we only show the first line
  return ellipsis(text, 100, '');
}

export function createTypeWords(type) {
  switch (type) {
    case 'RUMOR':
      return t`Contains misinformation`;
    case 'NOT_RUMOR':
      return t`Contains true information`;
    case 'OPINIONATED':
      return t`Contains personal perspective`;
    case 'NOT_ARTICLE':
      return t`Invalid request`;
  }
  return 'Undefined';
}

/**
 * @param {object} reply The reply object
 * @param {string} reply.reference
 * @param {string} reply.type
 * @returns {string} The reference message to send
 */
export function createReferenceWords({ reference, type }) {
  const prompt = type === 'OPINIONATED' ? t`different opinions` : t`references`;

  if (reference) return `${prompt}：${reference}`;
  return `\uDBC0\uDC85 ⚠️️ ${t`This reply has no ${prompt} and it may be biased`} ⚠️️  \uDBC0\uDC85`;
}

/**
 * prefilled text for reasons
 */
export const REASON_PREFIX = `💁 ${t`My reason is:`}\n`;
export const DOWNVOTE_PREFIX = `💡 ${t`I think the reply is not useful and I suggest:`}\n`;

/**
 * @param {string} state The current state
 * @param {string} text The prompt text
 * @param {string} prefix The prefix to use in the result text
 * @param {number} issuedAt The issuedAt that created this URL
 * @returns {string}
 */
export function getLIFFURL(state, text, prefix, issuedAt) {
  return `${process.env.LIFF_URL}?state=${state}&text=${encodeURIComponent(
    ellipsis(text, 10)
  )}&prefix=${encodeURIComponent(prefix)}&issuedAt=${issuedAt}`;
}

/**
 * @param {string} state The current state
 * @param {string} text The prompt text
 * @param {string} prefix The prefix to use in the result text
 * @param {string} issuedAt The current issuedAt
 * @returns {array} an array of reply message instances
 */
export function createAskArticleSubmissionReply(state, text, prefix, issuedAt) {
  const altText =
    '【送出訊息到公開資料庫？】\n' +
    '若這是「轉傳訊息」，而且您覺得這很可能是一則「謠言」，請將這則訊息送進公開資料庫建檔，讓好心人查證與回覆。\n' +
    '\n' +
    '雖然您不會立刻收到查證結果，但可以幫助到未來同樣收到這份訊息的人。\n' +
    '\n' +
    '請在 📱 智慧型手機上完成操作。';

  return [
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
              text: '🥇 成為全球首位回報此訊息的人',
              weight: 'bold',
              color: '#009900',
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
                '目前資料庫裡沒有您傳的訊息。若這是「轉傳訊息」，而且您覺得它很可能是一則「謠言」，',
              wrap: true,
            },
            {
              type: 'text',
              text: '請按「🆕 送進資料庫」，公開這則訊息、讓好心人查證與回覆。',
              color: '#009900',
              wrap: true,
            },
            {
              type: 'text',
              text:
                '雖然您不會立刻收到查證結果，但可以幫助到未來同樣收到這份訊息的人。',
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
                label: '🆕 送進資料庫',
                uri: getLIFFURL(state, text, prefix, issuedAt),
              },
            },
          ],
        },
        styles: {
          body: {
            separator: true,
          },
        },
      },
    },
  ];
}

export function isNonsenseText(/* text */) {
  // return text.length < 20;
  return false; // according to 20181017 meeting note, we remove limitation and observe
}

/**
 * @param {string} text
 * @param {number} limit
 * @return {string} if the text length is lower than limit, return text; else, return
 *                  text with ellipsis.
 */
export function ellipsis(text, limit, ellipsis = '⋯⋯') {
  if (splitter.countGraphemes(text) < limit) return text;

  return (
    splitter
      .splitGraphemes(text)
      .slice(0, limit - ellipsis.length)
      .join('') + ellipsis
  );
}

const SITE_URL = process.env.SITE_URL || 'https://cofacts.g0v.tw';

/**
 * @param {string} articleId
 * @returns {string} The article's full URL
 */
export function getArticleURL(articleId) {
  return `${SITE_URL}/article/${articleId}`;
}

/**
 * @param {string} articleUrl
 * @param {string} reason
 * @returns {object} Reply object with sharing buttings
 */
export function createArticleShareReply(articleUrl, reason) {
  return {
    type: 'template',
    altText:
      '遠親不如近鄰🌟問問親友總沒錯。把訊息分享給朋友們，說不定有人能幫你解惑！',
    template: {
      type: 'buttons',
      actions: [
        {
          type: 'uri',
          label: 'LINE 群組',
          uri: `line://msg/text/?${encodeURIComponent(
            `我收到這則訊息的想法是：\n${ellipsis(
              reason,
              70
            )}\n\n請幫我看看這是真的還是假的：${articleUrl}`
          )}`,
        },
        {
          type: 'uri',
          label: '臉書大神',
          uri: `https://www.facebook.com/dialog/share?openExternalBrowser=1&app_id=${
            process.env.FACEBOOK_APP_ID
          }&display=popup&quote=${encodeURIComponent(
            ellipsis(reason, 80)
          )}&hashtag=${encodeURIComponent(
            '#Cofacts求解惑'
          )}&href=${encodeURIComponent(articleUrl)}`,
        },
      ],
      title: '遠親不如近鄰🌟問問親友總沒錯',
      text: '說不定你的朋友裡，就有能替你解惑的人唷！\n你想要 Call-out 誰呢？',
    },
  };
}

/**
 * possible sources of incoming articles
 */
export const ARTICLE_SOURCES = [
  '親戚轉傳',
  '同事轉傳',
  '朋友轉傳',
  '自己輸入的',
];
