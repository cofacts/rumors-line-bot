import { t } from 'ttag';
import choosingArticle from './handlers/choosingArticle';
import choosingReply from './handlers/choosingReply';
import askingArticleSubmissionConsent from './handlers/askingArticleSubmissionConsent';
import askingArticleSource from './handlers/askingArticleSource';
import defaultState from './handlers/defaultState';
import { ManipulationError } from './handlers/utils';
import tutorial from './handlers/tutorial';
import {
  ChatbotEvent,
  ChatbotState,
  ChatbotStateHandlerParams,
  ChatbotStateHandlerReturnType,
} from 'src/types/chatbotState';
import { Message } from '@line/bot-sdk';

/**
 * Given input event and context, outputs the new context and the reply to emit.
 *
 * @param {Object<data>} context The current context of the bot
 * @param {*} state The input state
 * @param {*} event The input event
 * @param {*} userId LINE user ID that does the input
 */
export default async function handlePostback(
  { data = {} },
  state: ChatbotState,
  event: ChatbotEvent,
  userId: string
) {
  let replies: Message[] = [];

  if (event.input === undefined) {
    throw new Error('input undefined');
  }

  if (event.type !== 'postback') {
    throw new Error('wrong event type');
  }

  let params: ChatbotStateHandlerParams | ChatbotStateHandlerReturnType = {
    data,
    state,
    event,
    userId,
    replies,
  };

  // Sets data and replies
  //
  try {
    switch (params.state) {
      case 'CHOOSING_ARTICLE': {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        params = await choosingArticle(params);
        break;
      }
      case 'CHOOSING_REPLY': {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        params = await choosingReply(params);
        break;
      }
      case 'TUTORIAL': {
        params = tutorial(params);
        break;
      }
      case 'ASKING_ARTICLE_SOURCE': {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        params = await askingArticleSource(params);
        break;
      }
      case 'ASKING_ARTICLE_SUBMISSION_CONSENT': {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        params = await askingArticleSubmissionConsent(params);
        break;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        params = defaultState(params);
        break;
      }
    }
  } catch (e) {
    if (e instanceof ManipulationError) {
      params = {
        ...params,
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

  ({ data, replies } = params);

  return {
    context: { data },
    replies,
  };
}
