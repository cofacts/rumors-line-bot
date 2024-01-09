import { t } from 'ttag';
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
  searchText,
  searchMedia,
  createCooccurredSearchResultsCarouselContents,
  setMostSimilarArticlesAsCooccurrence,
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
    // use the first message in context as representative
    context.msgs[0].type === 'text' ? context.msgs[0].text : context.msgs[0].id
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

  // Use first article as representative article
  const articleUrl = getArticleURL(createdArticles[0].id);
  const articleCreatedMsg = t`Your submission is now recorded at ${articleUrl}`;

  // Produce AI reply for all created messages
  //
  const aiReplyPromises = createdArticles.map((article) =>
    createAIReply(article.id, userId)
  );

  if (context.msgs.length > 1) {
    // Search again, this time all messages should be in the database.
    // Most similar articles for each respective searched message will be set as cooccurrence.
    //
    const searchResults = await Promise.all(
      context.msgs.map(async (msg) =>
        msg.type === 'text'
          ? searchText(msg.text)
          : searchMedia(getLineContentProxyURL(msg.id), userId)
      )
    );
    await setMostSimilarArticlesAsCooccurrence(searchResults, userId);

    return {
      context,
      replies: [
        createTextMessage({
          text: `🔍 ${t`There are some messages that looks similar to the ones you have sent to me.`}`,
        }),
        createTextMessage({
          text:
            t`Internet rumors are often mutated and shared.
              Please choose the version that looks the most similar` + '👇',
        }),
        {
          type: 'flex',
          altText: t`Please choose the most similar message from the list.`,
          contents: {
            type: 'carousel',
            contents: createCooccurredSearchResultsCarouselContents(
              searchResults,
              context.sessionId
            ),
          },
        },
      ],
    };
  }

  // The user only asks for one article
  //
  const article = createdArticles[0];
  const [aiReply, { allowNewReplyUpdate }] = await Promise.all([
    aiReplyPromises[0],
    UserSettings.findOrInsertByUserId(userId),
  ]);

  return {
    context: {
      ...context,
      // Create new session, make article submission button expire after submission
      //
      sessionId: Date.now(),
    },
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
      ...(!aiReply
        ? [
            createTextMessage({
              text: t`In the meantime, you can:`,
            }),
          ]
        : [
            createTextMessage({
              text: '這篇文章尚待查核中，請先不要相信這篇文章。\n以下是機器人初步分析此篇訊息的結果，希望能帶給你一些想法。',
            }),
            aiReply,
            createTextMessage({
              text: '讀完以上機器人的自動分析後，您可以：',
            }),
          ]),
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
