import ua from 'universal-analytics';
import GraphemeSplitter from 'grapheme-splitter';
const splitter = new GraphemeSplitter();

// When document title is too long, event will be dropped.
// See: https://github.com/cofacts/rumors-line-bot/issues/97
//
const DOCUMENT_TITLE_LENGTH = 800;

/**
 * Sends a screen view and returns the visitor
 *
 * @param {string} uuid - Visitor uuid, corresponding to `messageSource`, it will be userId, groupId, roomId
 * @param {string} state - The current state the LINE bot is in
 * @param {string} documentTitle - The article content (user input) currently in search
 * @param {string} messageSource - The event source { 'user' | 'group' | 'room' }
 * @returns {ua.Visitor} universal analytics visitor
 */
export default function ga(
  uuid,
  state = 'N/A',
  documentTitle = '',
  messageSource = 'user'
) {
  const visitor = ua(process.env.GA_ID, uuid, { strictCidFormat: false });

  // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
  // screenview needs both screen name and application name, or it will print error
  //
  visitor.screenview(state, 'rumors-line-bot');

  if (documentTitle) {
    visitor.set(
      'dt',
      splitter
        .splitGraphemes(documentTitle)
        .slice(0, DOCUMENT_TITLE_LENGTH)
        .join('')
    );
  }

  visitor.set('cd1', messageSource);

  return visitor;
}
