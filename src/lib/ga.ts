import ua from 'universal-analytics';
import type { EventParams } from 'universal-analytics';
import { gaTitle } from './sharedUtils';
import { insertEventBatch } from './bq';
import type { EventBatch } from 'src/rumors-db/bq/events';
import rollbar from './rollbar';

/**
 * Sends a screen view and returns the visitor
 *
 * @param uuid - Visitor uuid, corresponding to `messageSource`, it will be userId, groupId, roomId
 * @param state - The current state the LINE bot is in
 * @param documentTitle - The article content (user input) currently in search
 * @param messageSource - The event source { 'user' | 'group' | 'room' }
 * @returns universal analytics visitor
 */
export default function ga(
  uuid: string,
  state = 'N/A',
  documentTitle = '',
  messageSource: 'user' | 'group' | 'room' = 'user'
) {
  const visitor = ua(process.env.GA_ID || '', uuid, { strictCidFormat: false });

  // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
  // screenview needs both screen name and application name, or it will print error
  //
  visitor.screenview(state, 'rumors-line-bot');

  if (documentTitle) {
    visitor.set('dt', gaTitle(documentTitle));
  }

  visitor.set('cd1', messageSource);

  let events: EventBatch['events'] = [];
  const extra: Record<string, unknown> = {};

  return {
    set(key: string, value: unknown) {
      extra[key] = value;
      return visitor.set(key, value);
    },

    event(evt: EventParams) {
      events.push({
        category: evt.ec ?? null,
        action: evt.ea ?? null,
        label: evt.el ?? null,
        value: evt.ev === undefined ? null : +evt.ev,
        time: new Date(),
      });
      return visitor.event(evt);
    },
    send() {
      insertEventBatch({
        text: documentTitle,
        messageSource,
        events,
        createdAt: new Date(),
        extra,
      }).catch((e) => {
        console.error('[insertAnalytics]', e);
        rollbar.error(`[insertAnalytics] ${e.message}`, e);
      });
      events = [];
      return visitor.send();
    },
  };
}
