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
  if (positive + negative === 0) return '[還沒有人針對此回應評價]';
  let result = '';
  if (positive) result += `有 ${positive} 人覺得此回應有幫助\n`;
  if (negative) result += `有 ${negative} 人覺得此回應沒幫助\n`;
  return `[${result.trim()}]`;
}

/**
 * @param {string} text - The text to show in flex message, text type
 * @return {string} The truncated text
 */
export function createFlexMessageText(text = '') {
  // Actually the upper limit is 2000, but 100 should be enough
  // because we only show the first line
  return text.slice(0, 100);
}

export function createTypeWords(type) {
  switch (type) {
    case 'RUMOR':
      return '❌ 含有不實訊息';
    case 'NOT_RUMOR':
      return '⭕ 含有真實訊息';
    case 'OPINIONATED':
      return '💬 含有個人意見';
    case 'NOT_ARTICLE':
      return '⚠️️ 不在查證範圍';
  }
  return '回應的狀態未定義！';
}

/**
 * @param {object} reply The reply object
 * @param {string} reply.reference
 * @param {string} reply.type
 * @returns {string} The reference message to send
 */
export function createReferenceWords({ reference, type }) {
  const prompt = type === 'OPINIONATED' ? '不同觀點請見' : '出處';

  if (reference) return `${prompt}：${reference}`;
  return `\uDBC0\uDC85 ⚠️️ 此回應沒有${prompt}，請自行斟酌回應之可信度。⚠️️  \uDBC0\uDC85`;
}

/**
 * prefilled text for reasons
 */
export const REASON_PLACEHOLDER = '因為⋯⋯';

/**
 * @param {number} issuedAt The "issuedAt" to put in postback action
 * @returns {array} an array of reply message instances
 */
export function createAskArticleSubmissionReply(issuedAt) {
  const altText =
    '【送出訊息到公開資料庫？】\n' +
    '若這是「轉傳訊息」，而且您覺得這很可能是一則「謠言」，請將這則訊息送進公開資料庫建檔，讓好心人查證與回覆。\n' +
    '\n' +
    '雖然您不會立刻收到查證結果，但可以幫助到未來同樣收到這份訊息的人。\n' +
    '\n' +
    '請按左下角「⌨️」鈕，把「為何您會覺得這是一則謠言」的理由傳給我們，幫助闢謠編輯釐清您有疑惑之處。' +
    '\n' +
    '若想放棄，請輸入「n」。';
  const accountName = process.env.LINE_AT_ID || 'cofacts';

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
              text: '送出訊息到公開資料庫？',
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
                '若這是「轉傳訊息」，而且您覺得這很可能是一則「謠言」，請將這則訊息送進公開資料庫建檔，讓好心人查證與回覆。',
              wrap: true,
              size: 'xxs',
            },
            {
              type: 'text',
              text:
                '雖然您不會立刻收到查證結果，但可以幫助到未來同樣收到這份訊息的人。',
              wrap: true,
              size: 'xxs',
            },
            {
              type: 'text',
              text: '請打字告訴我們：',
              weight: 'bold',
              wrap: true,
              color: '#990000',
              size: 'md',
            },
            {
              type: 'text',
              text: '為何您會覺得這是一則謠言？',
              weight: 'bold',
              color: '#ff0000',
              wrap: true,
              size: 'xxl',
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'button',
              action: createPostbackAction('放棄送出', 'n', issuedAt),
            },
            {
              type: 'button',
              style: 'primary',
              action: {
                type: 'uri',
                label: '⌨️ 傳理由給我們',
                uri: `line://oaMessage/@${accountName}/?${encodeURIComponent(
                  REASON_PLACEHOLDER
                )}`,
              },
            },
          ],
        },
      },
    },
  ];
}

export function isNonsenseText(text) {
  return text.length < 20;
}

const ELLIPSIS = '⋯⋯';

/**
 * @param {string} text
 * @param {number} limit
 * @return {string} if the text length is lower than limit, return text; else, return
 *                  text with ellipsis.
 */
export function ellipsis(text, limit) {
  if (text.length < limit) return text;

  return text.slice(0, limit - ELLIPSIS.length) + ELLIPSIS;
}

const SITE_URL = process.env.SITE_URL || 'https://cofacts.g0v.tw';

/**
 * @param {string} articleId
 * @returns {string} The article's full URL
 */
export function getArticleURL(articleId) {
  return `${SITE_URL}/article/${articleId}`;
}
