import { t } from 'ttag';
import { Message } from '@line/bot-sdk';
import { z } from 'zod';

import { ChatbotPostbackHandler } from 'src/types/chatbotState';
import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import { getArticleURL } from 'src/lib/sharedUtils';
import UserSettings from 'src/database/models/userSettings';
import UserArticleLink from 'src/database/models/userArticleLink';
import {
  Article,
  ArticleTypeEnum,
  SubmitMediaArticleUnderConsentMutation,
  SubmitMediaArticleUnderConsentMutationVariables,
  SubmitTextArticleUnderConsentMutation,
  SubmitTextArticleUnderConsentMutationVariables,
} from 'typegen/graphql';

import {
  ManipulationError,
  createTextMessage,
  createCommentBubble,
  createArticleShareBubble,
  createNotificationSettingsBubble,
  getLineContentProxyURL,
  createAIReply,
} from './utils';

// Input should be array of context.msgs idx. Empty if the user does not want to submit.
const inputSchema = z.array(z.number().int().min(0));

/** Postback input type for ASKING_ARTICLE_SUBMISSION_CONSENT state handler */
export type Input = z.infer<typeof inputSchema>;

function uppercase<T extends string>(s: T) {
  return s.toUpperCase() as Uppercase<T>;
}

const askingArticleSubmissionConsent: ChatbotPostbackHandler = async ({
  context,
  postbackData: { state, input: postbackInput },
  userId,
}) => {
  let input: Input;
  try {
    input = inputSchema.parse(postbackInput);
  } catch (e) {
    console.error('[askingArticleSubmissionConsnet]', e);
    throw new ManipulationError(t`Please choose from provided options.`);
  }

  const msgsToSubmit = context.msgs.filter((_, idx) => input.includes(idx));

  // istanbul ignore if
  if (msgsToSubmit.length !== input.length) {
    throw new ManipulationError('Index range out of bound'); // Should never happen
  }

  const visitor = ga(
    userId,
    state,
    msgsToSubmit[0].type === 'text' ? msgsToSubmit[0].text : msgsToSubmit[0].id
  );

  // Abort if user does not want to submit
  //
  if (msgsToSubmit.length === 0) {
    visitor.event({ ec: 'Article', ea: 'Create', el: 'No' }).send();

    return {
      context,
      replies: [
        createTextMessage({
          text: t`The message has not been reported and won’t be fact-checked. Thanks anyway!`,
        }),
      ],
    };
  }

  visitor.event({ ec: 'Article', ea: 'Create', el: 'Yes' }).send();

  const createdArticles = await Promise.all(
    msgsToSubmit.map(async (msg) => {
      if (msg.type === 'text') {
        const result = await gql`
          mutation SubmitTextArticleUnderConsent($text: String!) {
            CreateArticle(text: $text, reference: { type: LINE }) {
              id
            }
          }
        `<
          SubmitTextArticleUnderConsentMutation,
          SubmitTextArticleUnderConsentMutationVariables
        >({ text: msg.text }, { userId });
        return result.data.CreateArticle;
      }

      const articleType: ArticleTypeEnum = uppercase(msg.type);
      const proxyUrl = getLineContentProxyURL(msg.id);

      const result = await gql`
        mutation SubmitMediaArticleUnderConsent(
          $mediaUrl: String!
          $articleType: ArticleTypeEnum!
        ) {
          CreateMediaArticle(
            mediaUrl: $mediaUrl
            articleType: $articleType
            reference: { type: LINE }
          ) {
            id
          }
        }
      `<
        SubmitMediaArticleUnderConsentMutation,
        SubmitMediaArticleUnderConsentMutationVariables
      >({ mediaUrl: proxyUrl, articleType }, { userId });
      return result.data.CreateMediaArticle;
    })
  );

  /* istanbul ignore if */
  if (
    createdArticles.length === 0 ||
    !createdArticles.every(
      (article): article is Pick<Article, 'id'> =>
        !!article && article.id !== null
    )
  ) {
    throw new Error(
      '[askingArticleSubmissionConsent] article is not created successfully'
    );
  }

  // No need to wait for article-user link to be created
  createdArticles.forEach((article) =>
    UserArticleLink.createOrUpdateByUserIdAndArticleId(userId, article.id)
  );

  // Create new session, make article submission button expire after submission
  context.sessionId = Date.now();

  // Use first article as representative article
  const articleUrl = getArticleURL(createdArticles[0].id);
  const articleCreatedMsg = t`Your submission is now recorded at ${articleUrl}`;

  if (context.msgs.length > 1) {
    // Continue with the rest of the messages
    // FIXME: implement this
  }

  // The user only asks for one article
  //
  const firstMsg = context.msgs[0];
  const article = createdArticles[0];

  const { allowNewReplyUpdate } = await UserSettings.findOrInsertByUserId(
    userId
  );

  let maybeAIReplies: Message[] = [
    createTextMessage({
      text: t`In the meantime, you can:`,
    }),
  ];

  if (firstMsg.type === 'text') {
    const aiReply = await createAIReply(article.id, userId);

    if (aiReply) {
      maybeAIReplies = [
        createTextMessage({
          text: '這篇文章尚待查核中，請先不要相信這篇文章。\n以下是機器人初步分析此篇訊息的結果，希望能帶給你一些想法。',
        }),
        aiReply,
        createTextMessage({
          text: '讀完以上機器人的自動分析後，您可以：',
        }),
      ];
    }
  }

  return {
    context,
    replies: [
      {
        type: 'flex',
        altText: t`The message has now been recorded at Cofacts for volunteers to fact-check. Thank you for submitting!`,
        contents: {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                wrap: true,
                text: t`The message has now been recorded at Cofacts for volunteers to fact-check. Thank you for submitting!`,
              },
              {
                type: 'button',
                action: {
                  type: 'uri',
                  label: t`View reported message`,
                  uri: articleUrl,
                },
                margin: 'md',
              },
            ],
          },
        },
      },
      ...maybeAIReplies,
      {
        type: 'flex',
        altText: articleCreatedMsg,
        contents: {
          type: 'carousel',
          contents: [
            createCommentBubble(article.id),
            // Ask user to turn on notification if the user did not turn it on
            //
            process.env.NOTIFY_METHOD &&
              !allowNewReplyUpdate &&
              createNotificationSettingsBubble(),
            createArticleShareBubble(articleUrl),
          ].filter(Boolean),
        },
      },
    ],
  };
};

export default askingArticleSubmissionConsent;
