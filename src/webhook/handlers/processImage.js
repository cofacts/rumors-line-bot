import { getLineContentProxyURL } from './utils';

export default async function(messageId) {
  console.log(`Image url:  ${getLineContentProxyURL(messageId)}`);
}
