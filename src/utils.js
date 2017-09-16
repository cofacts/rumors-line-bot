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

export function createFeedbackWords(feedbacks) {
  let positive = 0, negative = 0;
  feedbacks.forEach(e => {
    if (e.score > 0) {
      positive++;
    }
    if (e.score < 0) {
      negative++;
    }
  });
  if (positive + negative === 0) return '[還沒有人針對此回應評價]';
  let result = '';
  if (positive) result += `有 ${positive} 人覺得此回應有幫助\n`;
  if (negative) result += `有 ${negative} 人覺得此回應沒幫助\n`;
  return `[${result.trim()}]`;
}

export function createReferenceWords(reference) {
  if (reference) return `出處：${reference}`;
  return '出處：此回應沒有出處';
}
