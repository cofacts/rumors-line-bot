import ua from 'universal-analytics';

// When document title is too long, event will be dropped.
// See: https://github.com/cofacts/rumors-line-bot/issues/97
//
const DOCUMENT_TITLE_LENGTH = 800;

/**
 * Sends a screen view and returns the visitor
 *
 * @param {string} userId
 * @param {string} state - The current state the LINE bot is in
 * @param {string} documentTitle - The article content (user input) currently in search
 * @returns {ua.Visitor} universal analytics visitor
 */
export default function ga(userId, state = 'N/A', documentTitle = '') {
  const visitor = ua(process.env.GA_ID, userId, { strictCidFormat: false });

  // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
  // screenview needs both screen name and application name, or it will print error
  //
  visitor.screenview(state, 'rumors-line-bot');

  if (documentTitle) {
    visitor.set('dt', documentTitle.slice(0, DOCUMENT_TITLE_LENGTH));
  }

  return visitor;
}
