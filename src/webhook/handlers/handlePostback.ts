import { t } from 'ttag';
import choosingArticle from './choosingArticle';
import choosingReply from './choosingReply';
import askingArticleSubmissionConsent from './askingArticleSubmissionConsent';
import askingArticleSource from './askingArticleSource';
import defaultState from './defaultState';
import askingCooccurence from './askingCooccurrence';
import { ManipulationError } from './utils';
import tutorial from './tutorial';
import {
  ChatbotPostbackHandlerParams,
  Result,
  Context,
  PostbackActionData,
} from 'src/types/chatbotState';

/**
 * Given input event and context, outputs the new context and the reply to emit.
 *
 * @param data The current context of the bot
 * @param postbackData The input postback data extracted from event
 * @param userId LINE user ID that does the input
 */
export default async function handlePostback(
  context: Context,
  postbackData: PostbackActionData<unknown>,
  userId: string
) {
  const params: ChatbotPostbackHandlerParams = {
    context,
    postbackData,
    userId,
  };

  let result: Result;

  // Sets data and replies
  //
  try {
    switch (params.postbackData.state) {
      case 'CHOOSING_ARTICLE': {
        result = await choosingArticle(params);
        break;
      }
      case 'CHOOSING_REPLY': {
        result = await choosingReply(params);
        break;
      }
      case 'TUTORIAL': {
        result = tutorial(params);
        break;
      }
      case 'ASKING_ARTICLE_SOURCE': {
        result = await askingArticleSource(params);
        break;
      }
      case 'ASKING_ARTICLE_SUBMISSION_CONSENT': {
        result = await askingArticleSubmissionConsent(params);
        break;
      }
      case 'ASKING_COOCCURRENCE': {
        result = await askingCooccurence(params);
        break;
      }
      case 'CONTINUE': {
        // Do nothing; pass context (updated by singleUserHandler) as-is and reply nothing.
        result = {
          context,
          replies: [],
        };
        break;
      }
      default: {
        result = defaultState(params);
        break;
      }
    }
  } catch (e) {
    if (e instanceof ManipulationError) {
      result = {
        context,
        replies: [
          {
            type: 'flex',
            altText: e.toString(),
            contents: {
              type: 'bubble',
              header: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: `⚠️ ${t`Wrong usage`}`,
                    color: '#ffb600',
                    weight: 'bold',
                  },
                ],
              },
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: e.message,
                    wrap: true,
                  },
                ],
              },
              styles: {
                body: {
                  separator: true,
                },
              },
            },
          },
        ],
      };
    } else {
      throw e;
    }
  }

  return result;
}
