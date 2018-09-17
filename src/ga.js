import ua from 'universal-analytics';

// When document title is too long, event will be dropped.
// See: https://github.com/cofacts/rumors-line-bot/issues/97
//
const DOCUMENT_TITLE_LENGTH = 800;

/**
 * @param {string} userId
 * @param {string} documentTitle - The article content (user input) currently in search
 * @returns {ua.Visitor} universal analytics visitor
 */
export default function ga(userId, documentTitle = '') {
  const visitor = ua(process.env.GA_ID, userId, { strictCidFormat: false });

  // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
  visitor.set('appName', 'rumors-line-bot');

  if (documentTitle) {
    visitor.set('dt', documentTitle.slice(0, DOCUMENT_TITLE_LENGTH));
  }

  return visitor;
}
