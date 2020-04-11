/**
 * Constants and functions shared across LIFF, webhook and other parts
 */

import { t } from 'ttag';

const SITE_URL = process.env.SITE_URL || 'https://cofacts.g0v.tw';

/**
 * prefilled text for LIFF sendMessage()
 */
export const REASON_PREFIX = `💁 ${t`My reason is:`}\n`;
export const DOWNVOTE_PREFIX = `💡 ${t`I think the reply is not useful and I suggest:`}\n`;

/**
 * @param {string} articleId
 * @returns {string} The article's full URL
 */
export function getArticleURL(articleId) {
  return `${SITE_URL}/article/${articleId}`;
}
