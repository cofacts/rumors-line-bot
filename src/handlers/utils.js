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
export function createReferenceWords(reference) {
  if (reference) return `出處：${reference}`;
  return '\uDBC0\uDC85 ⚠️️ 此回應沒有出處，請自行斟酌回應真實。⚠️️  \uDBC0\uDC85';
}

export function isNonsenseText(text) {
  let urls = text.match(urlRegex()) || [];
  let sum = urls.reduce((sum, url) => sum + url.length, 0);
  return text.length - sum < 15;
}
