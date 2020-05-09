import { t } from 'ttag';
import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import { SOURCE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import {
  ManipulationError,
  createArticleShareReply,
  createSuggestOtherFactCheckerReply,
  getArticleSourceOptionFromLabel,
  getLIFFURL,
} from './utils';

export default async function askingArticleSubmissionConsent(params) {
  let { data, state, event, userId, replies, isSkipUser } = params;

  if (!event.input.startsWith(SOURCE_PREFIX)) {
    throw new ManipulationError(
      t`Please press the latest button to submit message to database.`
    );
  }

  const visitor = ga(userId, state, data.searchedText);

  const sourceOption = getArticleSourceOptionFromLabel(
    event.input.slice(SOURCE_PREFIX.length)
  );

  visitor.event({
    ec: 'UserInput',
    ea: 'ProvidingSource',
    el: sourceOption.value,
  });

  if (!sourceOption.valid) {
    replies = [
      {
        type: 'text',
        text: t`Thanks for the info.`,
      },
      createSuggestOtherFactCheckerReply(),
    ];
    state = '__INIT__';
  } else {
    visitor.event({ ec: 'Article', ea: 'Create', el: 'Yes' });

    const {
      data: { CreateArticle },
    } = await gql`
      mutation($text: String!) {
        CreateArticle(text: $text, reference: { type: LINE }) {
          id
        }
      }
    `({ text: data.searchedText }, { userId });

    const articleUrl = getArticleURL(CreateArticle.id);
    const articleCreatedMsg = t`Your submission is now recorded at ${articleUrl}`;

    // Track the source of the new message.
    visitor.event({
      ec: 'Article',
      ea: 'ProvidingSource',
      el: `${CreateArticle.id}/${sourceOption.value}`,
    });

    replies = [
      {
        type: 'flex',
        altText: articleCreatedMsg,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                wrap: true,
                text: articleCreatedMsg,
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
  }

  visitor.send();
  return { data, state, event, userId, replies, isSkipUser };
}
