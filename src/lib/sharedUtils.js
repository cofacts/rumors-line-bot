/**
 * Constants and functions shared across LIFF, webhook and other parts
 */

import { t } from 'ttag';

const SITE_URL = process.env.SITE_URL || 'https://cofacts.g0v.tw';

/**
 * prefilled text for LIFF sendMessage()
 */
export const REASON_PREFIX = `💁 ${t`My reason is`}:\n`;
export const SOURCE_PREFIX = `ℹ️ ${t`I got the message from`}:\n`;
export const DOWNVOTE_PREFIX = `💡 ${t`I think the reply is not useful and I suggest`}:\n`;

/**
 * @param {string} articleId
 * @returns {string} The article's full URL
 */
export function getArticleURL(articleId) {
  return `${SITE_URL}/article/${articleId}`;
}

export const ARTICLE_SOURCE_OPTIONS = [
  {
    label: t`A LINE group`,
    valid: true,
  },
  {
    label: t`A LINE official account`,
    valid: true,
  },
  {
    label: t`Someone sent me on LINE in private`,
    valid: true,
  },
  {
    label: t`Somewhere outside LINE`,
    valid: false,
  },
  {
    label: t`I typed it out myself`,
    valid: false,
  },
];
