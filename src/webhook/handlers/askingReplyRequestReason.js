import { t } from 'ttag';
import ga from 'src/lib/ga';
import { getArticleURL, SOURCE_PREFIX } from 'src/lib/sharedUtils';
import {
  ManipulationError,
  createArticleShareReply,
  getArticleSourceOptionFromLabel,
  getLIFFURL,
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
        footer: {
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'button',
              action: {
                type: 'uri',
                label: t`See reported message`,
                uri: articleUrl,
              },
              style: 'primary',
              color: '#333333',
            },
            {
              type: 'button',
              action: {
                type: 'uri',
                label: t`Provide more info`,
                uri: getLIFFURL('reason', userId, data.sessionId),
              },
              style: 'primary',
              color: '#ffb600',
            },
          ],
        },
      },
    },
    createArticleShareReply(articleUrl),
  ];
  state = '__INIT__';

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
