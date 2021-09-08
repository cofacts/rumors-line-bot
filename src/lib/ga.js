import ua from 'universal-analytics';
import { gaTitle } from './sharedUtils';

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
    visitor.set('dt', gaTitle(documentTitle));
  }

  visitor.set('cd1', messageSource);

  return visitor;
}
