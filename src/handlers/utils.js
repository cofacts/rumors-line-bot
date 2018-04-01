import urlRegex from 'url-regex';

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
  return `\uDBC0\uDC85 ⚠️️ 此回應沒有${prompt}，請自行斟酌回應真實。⚠️️  \uDBC0\uDC85`;
}

export function isNonsenseText(text) {
  let urls = text.match(urlRegex()) || [];
  let sum = urls.reduce((sum, url) => sum + url.length, 0);
  return text.length - sum < 15;
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
