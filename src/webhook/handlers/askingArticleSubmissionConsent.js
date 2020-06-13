import { t } from 'ttag';
import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import { SOURCE_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import {
  ManipulationError,
  createArticleShareBubble,
  createSuggestOtherFactCheckerReply,
  getArticleSourceOptionFromLabel,
  createReasonButtonFooter,
} from './utils';

import UserArticleLink from '../../database/models/userArticleLink';

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

    await UserArticleLink.create({ userId, articleId: CreateArticle.id });

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
          type: 'carousel',
          contents: [
            {
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
              footer: createReasonButtonFooter(
                articleUrl,
                userId,
                data.sessionId
              ),
            },
            createArticleShareBubble(articleUrl),
          ],
        },
      },
    ];

    // Record article ID in context for reason LIFF
    data.selectedArticleId = CreateArticle.id;
    state = '__INIT__';
  }

  visitor.send();
  return { data, state, event, userId, replies, isSkipUser };
}
