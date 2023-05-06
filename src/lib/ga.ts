import ua from 'universal-analytics';
import { gaTitle } from './sharedUtils';

/**
 * Typescript only narrows `obj` for in operator, but not narrowing `key`.
 * This type predicate also narrows the key.
 *
 * Ref: https://stackoverflow.com/a/74631955/1582110
 */
function isKey<T extends object>(
  obj: T,
  key: string | symbol | number
): key is keyof T {
  return key in obj;
}

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
  messageSource = 'user'
) {
  const visitor = ua(process.env.GA_ID || '', uuid, { strictCidFormat: false });

  // Ref: https://developers.google.com/analytics/devguides/collection/analyticsjs/screens
  // screenview needs both screen name and application name, or it will print error
  //
  visitor.screenview(state, 'rumors-line-bot');

  let calls: [prop: string, args: unknown[]][] = [];

  // A proxy that records visitor's method calls
  const proxiedVisitor = new Proxy(visitor, {
    get(visitor, prop) {
      if (!isKey(visitor, prop)) return; // Make Typescript happy

      if (typeof visitor[prop] !== 'function') return visitor[prop];

      if (prop === 'send') {
        console.log(calls);
        calls = [];
      }

      return (...args: unknown[]) => {
        calls.push([prop, args]);

        /* @ts-expect-error: vistor[prop] is a union of functions */
        return visitor[prop](...args);
      };
    },
  });

  if (documentTitle) {
    proxiedVisitor.set('dt', gaTitle(documentTitle));
  }

  proxiedVisitor.set('cd1', messageSource);

  return proxiedVisitor;
}
