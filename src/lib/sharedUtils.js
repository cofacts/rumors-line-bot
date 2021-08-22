/**
 * Constants and functions shared across LIFF, webhook and other parts
 */

import { t } from 'ttag';
import dateFnsFormat from 'date-fns/format';
import dateFnsFormatDistanceToNow from 'date-fns/formatDistanceToNow';

const SITE_URLS = (process.env.SITE_URLS || 'https://cofacts.g0v.tw').split(
  ','
);

/**
 * prefilled text for LIFF sendMessage()
 */
export const REASON_PREFIX = `💁 ${t`My reason is`}:\n`;
export const SOURCE_PREFIX_FRIST_SUBMISSION = `1️⃣ ${t`I got the message from`}:\n`;
export const SOURCE_PREFIX_NOT_YET_REPLIED = `ℹ️ ${t`I got the message from`}:\n`;
export const UPVOTE_PREFIX = `👍 ${t`I think the reply is useful and I want to add`}:\n`;
export const DOWNVOTE_PREFIX = `💡 ${t`I think the reply is not useful and I suggest`}:\n`;
export const VIEW_ARTICLE_PREFIX = `📃 ${t`See replies of`}:\n`;

/**
 * @param {string} articleId
 * @returns {string} The article's full URL
 */
export function getArticleURL(articleId) {
  return `${SITE_URLS[0]}/article/${articleId}`;
}

/**
 * Extracts Article ID from message with just article URL, or prefix + article URL.
 *
 * @param {string} message
 * @returns {string} Extracts article ID from message, or empty string if the given string is not article URL.
 */
export function extractArticleId(message) {
  if (message.startsWith(VIEW_ARTICLE_PREFIX)) {
    message = message.replace(VIEW_ARTICLE_PREFIX, '');
  }

  for (const siteUrl of SITE_URLS) {
    const articleUrlPrefix = `${siteUrl}/article/`;
    if (message.startsWith(articleUrlPrefix)) {
      return message.replace(articleUrlPrefix, '');
    }
  }

  return '';
}

/**
 * label: Display text in LIFF & the value sent via sendMessage
 * value: Normalized value to store in database / Google Analytics
 * valid: If we should proceed submission
 */
export const ARTICLE_SOURCE_OPTIONS = [
  {
    label: t`A LINE group`,
    value: 'group message',
    valid: true,
  },
  {
    label: t`A LINE official account`,
    value: 'official account',
    valid: true,
  },
  {
    label: t`Someone sent me on LINE in private`,
    value: 'private message',
    valid: true,
  },
  {
    label: t`Somewhere outside LINE`,
    value: 'outside LINE',
    valid: false,
  },
  {
    label: t`I typed it out myself`,
    value: 'manual input',
    valid: false,
  },
];

let locale = require(`date-fns/locale/${(process.env.LOCALE || 'en_US').replace(
  '_',
  '-'
)}`);

// Svelte fix: babel interprets default automatically, but svelte doesn't.
/* istanbul ignore next */
locale = locale.default ? locale.default : locale;

function formatAbsolute(date, format = 'PP', config = {}) {
  return dateFnsFormat(date, format, { ...config, locale });
}

export function formatDistanceToNow(date, config = {}) {
  return dateFnsFormatDistanceToNow(date, { ...config, locale });
}

const THRESHOLD = 86400 * 2 * 1000; // 2 days in milliseconds

export function format(date) {
  const now = new Date();

  if (now - date < THRESHOLD) {
    const dateStr = formatDistanceToNow(date);
    return t`${dateStr} ago`;
  }

  return formatAbsolute(date);
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
