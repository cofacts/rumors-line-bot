import { t } from 'ttag';
import ga from 'src/lib/ga';
import { getArticleURL, SOURCE_PREFIX } from 'src/lib/sharedUtils';
import {
  ManipulationError,
  createArticleShareReply,
  getArticleSourceOptionFromLabel,
  createReasonButtonFooter,
} from './utils';

export default async function askingReplyRequestSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!event.input.startsWith(SOURCE_PREFIX)) {
    throw new ManipulationError(
      t`Please press the latest button to submit message to database.`
    );
  }

  const sourceOption = getArticleSourceOptionFromLabel(
    event.input.slice(SOURCE_PREFIX.length)
  );

  const visitor = ga(userId, state, data.selectedArticleText);

  visitor.event({
    ec: 'UserInput',
    ea: 'ProvidingSource',
    el: sourceOption.value,
  });

  visitor.event({
    ec: 'Article',
    ea: 'ProvidingSource',
    el: `${data.selectedArticleId}/${sourceOption.value}`,
  });

  const articleUrl = getArticleURL(data.selectedArticleId);
  const sourceRecordedMsg = t`Thanks for the info.`;

  replies = [
    {
      type: 'flex',
      altText: sourceRecordedMsg,
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              wrap: true,
              text: sourceRecordedMsg,
            },
          ],
        },
        footer: createReasonButtonFooter(articleUrl, userId, data.sessionId),
      },
    },
    createArticleShareReply(articleUrl),
  ];
  state = '__INIT__';

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
