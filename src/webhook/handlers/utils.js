import { t, msgid, ngettext } from 'ttag';
import GraphemeSplitter from 'grapheme-splitter';
import { sign } from 'src/lib/jwt';

const splitter = new GraphemeSplitter();

/**
 * @param {string} label - Postback action button text, max 20 words
 * @param {string} input - Input when pressed
 * @param {string} sessionId - Current session ID
 */
export function createPostbackAction(label, input, sessionId) {
  return {
    type: 'postback',
    label,
    data: JSON.stringify({
      input,
      sessionId,
    }),
  };
}

/**
 * @param {number} positive - Count of positive feedbacks
 * @param {number} negative - Count of negative feedbacks
 * @return {string} Description of feedback counts
 */
export function createFeedbackWords(positive, negative) {
  if (positive + negative === 0) return t`No feedback yet`;
  let result = '';
  if (positive)
    result +=
      '👍 ' +
      ngettext(
        msgid`${positive} user considers this helpful`,
        `${positive} users consider this helpful`,
        positive
      ) +
      '\n';
  if (negative)
    result +=
      '😕 ' +
      ngettext(
        msgid`${negative} user consider this not useful`,
        `${negative} users consider this not useful`,
        negative
      ) +
      '\n';
  return result.trim();
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

const LIFF_EXP_SEC = 86400; // LIFF JWT is only valid for 1 day

/**
 * @param {'source'|'reason'|'feedback'} page - The page to display
 * @param {string} userId - LINE user ID
 * @param {string} sessionId - The current session ID
 * @returns {string}
 */
export function getLIFFURL(page, userId, sessionId) {
  const jwt = sign({ sessionId, exp: Date.now() / 1000 + LIFF_EXP_SEC });

  return `${process.env.LIFF_URL}?p=${page}&token=${jwt}`;
}

const flexMessageAltText = `📱 ${t`Please proceed on your mobile phone.`}`;

/**
 * @param {string} userId - LINE user ID
 * @param {string} sessionId - Search session ID
 * @returns {object[]} an array of reply message instances
 */
export function createAskArticleSubmissionConsent(userId, sessionId) {
  const titleText = `🥇 ${t`Be the first to report the message`}`;
  const btnText = `🆕 ${t`Submit to database`}`;
  const spans = [
    {
      type: 'span',
      text: t`Currently we don't have this message in our database. If you think it is probably a rumor,`,
    },
    {
      type: 'span',
      text: t`Press ${btnText} to make this message public on Cofacts database for nice volunteers to fact-check.`,
    },
    {
      type: 'text',
      text: t`Although you won't receive answers rightaway, you can help the people who receive the same message in the future.`,
    },
  ];

  return [
    {
      type: 'flex',
      altText: titleText + '\n' + flexMessageAltText,
      contents: {
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'text',
              text: `🥇 ${t`Be the first to submit the message`}`,
              weight: 'bold',
              color: '#ffb600',
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
              contents: spans,
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
                label: btnText,
                uri: getLIFFURL('source', userId, sessionId),
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
