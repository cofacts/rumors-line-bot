import { t } from 'ttag';
import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import { SOURCE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import {
  FLEX_MESSAGE_ALT_TEXT,
  ManipulationError,
  createArticleShareReply,
  getArticleSourceOptionFromLabel,
  getLIFFURL,
} from './utils';

const MANUAL_FACT_CHECKERS = [
  {
    label: 'MyGoPen 賣擱騙',
    value: 'line://ti/p/%40mygopen',
  },
  {
    label: '蘭姆酒吐司',
    value: 'line://ti/p/%40rumtoast',
  },
];

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

  if (!sourceOption.valid) {
    const suggestion = t`Thanks.\n\nWe suggest forwarding the message to the following fact-checkers instead. They have 💁 1-on-1 Q&A service to respond to your questions.`;
    replies = [
      {
        type: 'flex',
        altText: `${suggestion}\n\n${FLEX_MESSAGE_ALT_TEXT}`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: suggestion,
                wrap: true,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: MANUAL_FACT_CHECKERS.map(({ label, value }) => ({
              type: 'button',
              action: {
                type: 'uri',
                label,
                uri: value,
              },
              style: 'primary',
              color: '#333333',
            })),
          },
          styles: {
            body: {
              separator: true,
            },
          },
        },
      },
    ];

    state = '__INIT__';
  } else {
    // Track the source of the new message.
    visitor.event({
      ec: 'Article',
      ea: 'ProvidingSource',
      el: sourceOption.label,
    });

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
