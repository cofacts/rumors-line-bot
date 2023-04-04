import { t } from 'ttag';
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

export default async function askingArticleSubmissionConsent(params) {
  let { data, state, event, userId, replies } = params;

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
          mutation ($text: String!) {
            CreateArticle(text: $text, reference: { type: LINE }) {
              id
            }
          }
        `({ text: data.searchedText }, { userId });
        article = result.data.CreateArticle;
      } else {
        if (!data.messageId) {
          // Should not be here
          throw new Error('No message ID found, cannot submit message.');
        }

        const proxyUrl = getLineContentProxyURL(data.messageId);
        const result = await gql`
          mutation ($mediaUrl: String!, $articleType: ArticleTypeEnum!) {
            CreateMediaArticle(
              mediaUrl: $mediaUrl
              articleType: $articleType
              reference: { type: LINE }
            ) {
              id
            }
          }
        `(
          { mediaUrl: proxyUrl, articleType: data.messageType.toUpperCase() },
          { userId }
        );
        article = result.data.CreateMediaArticle;
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

      let maybeAIReplies = [
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
            {
              type: 'text',
              text: aiReply,
            },
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
            ].filter((m) => m),
          },
        },
      ];
      state = '__INIT__';
    }
  }

  visitor.send();
  return { data, event, userId, replies };
}
