import { t } from 'ttag';
import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import {
  SOURCE_PREFIX_FRIST_SUBMISSION,
  getArticleURL,
} from 'src/lib/sharedUtils';
import {
  createArticleShareBubble,
  createSuggestOtherFactCheckerReply,
  getArticleSourceOptionFromLabel,
  createReasonButtonFooter,
} from './utils';

import UserArticleLink from '../../database/models/userArticleLink';

export default async function askingArticleSubmissionConsent(params) {
  let { data, state, event, userId, replies, isSkipUser } = params;

  const visitor = ga(userId, state, data.searchedText);

  const sourceOption = getArticleSourceOptionFromLabel(
    event.input.slice(SOURCE_PREFIX_FRIST_SUBMISSION.length)
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

    await UserArticleLink.createOrUpdateByUserIdAndArticleId(
      userId,
      CreateArticle.id
    );

    // Create new session, make article submission button expire after submitting
    data.sessionId = Date.now();

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
  }

  visitor.send();
  return { data, event, userId, replies, isSkipUser };
}
