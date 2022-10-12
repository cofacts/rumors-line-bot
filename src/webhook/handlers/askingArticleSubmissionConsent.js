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
      let article;
      if (data.searchedText && !data.messageId) {
        const result = await gql`
          mutation($text: String!) {
            CreateArticle(text: $text, reference: { type: LINE }) {
              id
            }
          }
        `({ text: data.searchedText }, { userId });
        article = result.data.CreateArticle;
      } else if (data.messageId) {
        const proxyUrl = getLineContentProxyURL(data.messageId);
        const result = await gql`
          mutation($mediaUrl: String!, $articleType: ArticleTypeEnum!) {
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
        createTextMessage({
          text: t`In the meantime, you can:`,
        }),
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
            ].filter(m => m),
          },
        },
      ];
      state = '__INIT__';
    }
  }

  visitor.send();
  return { data, event, userId, replies };
}
