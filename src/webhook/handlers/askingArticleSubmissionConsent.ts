import { t } from 'ttag';
import { Message } from '@line/bot-sdk';

import { ChatbotStateHandler } from 'src/types/chatbotState';
import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import { getArticleURL } from 'src/lib/sharedUtils';
import {
  POSTBACK_YES,
  POSTBACK_NO,
  ManipulationError,
  createTextMessage,
  createCommentBubble,
  createArticleShareBubble,
  createNotificationSettingsBubble,
  getLineContentProxyURL,
  createAIReply,
} from './utils';
import UserSettings from 'src/database/models/userSettings';
import UserArticleLink from 'src/database/models/userArticleLink';
import {
  ArticleTypeEnum,
  SubmitMediaArticleUnderConsentMutation,
  SubmitMediaArticleUnderConsentMutationVariables,
  SubmitTextArticleUnderConsentMutation,
  SubmitTextArticleUnderConsentMutationVariables,
} from 'typegen/graphql';

function uppercase<T extends string>(s: T) {
  return s.toUpperCase() as Uppercase<T>;
}

const askingArticleSubmissionConsent: ChatbotStateHandler = async (params) => {
  const { data, event, userId } = params;
  let { state, replies } = params;

  const visitor = ga(userId, state, data.searchedText);

  switch (event.input) {
    default:
      throw new ManipulationError(t`Please choose from provided options.`);

    case POSTBACK_NO:
      visitor.event({ ec: 'Article', ea: 'Create', el: 'No' });
      replies = [
        createTextMessage({
          text: t`The message has not been reported and won’t be fact-checked. Thanks anyway!`,
        }),
      ];
      state = '__INIT__';
      break;

    case POSTBACK_YES: {
      visitor.event({ ec: 'Article', ea: 'Create', el: 'Yes' });
      const isTextArticle = data.searchedText && !data.messageId;
      let article;
      if (isTextArticle) {
        const result = await gql`
          mutation SubmitTextArticleUnderConsent($text: String!) {
            CreateArticle(text: $text, reference: { type: LINE }) {
              id
            }
          }
        `<
          SubmitTextArticleUnderConsentMutation,
          SubmitTextArticleUnderConsentMutationVariables
        >({ text: data.searchedText ?? '' }, { userId });
        article = result.data.CreateArticle;
      } else {
        /* istanbul ignore if */
        if (!data.messageId) {
          // Should not be here
          throw new Error('No message ID found, cannot submit message.');
        }

        const articleType: ArticleTypeEnum = (() => {
          switch (data.messageType) {
            case 'image':
            case 'audio':
            case 'video':
              return uppercase(data.messageType);
            default:
              throw new Error(
                `[askingArticleSubmissionConsent] unsupported message type ${data.messageType}`
              );
          }
        })();

        const proxyUrl = getLineContentProxyURL(data.messageId);

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
        article = result.data.CreateMediaArticle;
      }

      /* istanbul ignore if */
      if (!article?.id) {
        throw new Error(
          '[askingArticleSubmissionConsent] article is not created successfully'
        );
      }

      await UserArticleLink.createOrUpdateByUserIdAndArticleId(
        userId,
        article.id
      );

      // Create new session, make article submission button expire after submission
      data.sessionId = Date.now();

      const articleUrl = getArticleURL(article.id);
      const articleCreatedMsg = t`Your submission is now recorded at ${articleUrl}`;
      const { allowNewReplyUpdate } = await UserSettings.findOrInsertByUserId(
        userId
      );

      let maybeAIReplies: Message[] = [
        createTextMessage({
          text: t`In the meantime, you can:`,
        }),
      ];

      if (isTextArticle) {
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

      replies = [
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
      ];
      state = '__INIT__';
    }
  }

  visitor.send();
  return { data, event, userId, replies };
};

export default askingArticleSubmissionConsent;