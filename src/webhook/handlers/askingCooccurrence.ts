import { z } from 'zod';
import { t } from 'ttag';

import ga from 'src/lib/ga';
import { ChatbotPostbackHandler } from 'src/types/chatbotState';

import {
  POSTBACK_YES,
  POSTBACK_NO,
  ManipulationError,
  createTextMessage,
  searchText,
  searchMedia,
  getLineContentProxyURL,
} from './utils';
import gql from 'src/lib/gql';

const inputSchema = z.enum([POSTBACK_NO, POSTBACK_YES]);

/** Minimum similarity for a CooccurredMessage to be considered as existing in DB */
const IN_DB_THRESHOLD = 0.8;

/** Postback input type for ASKING_ARTICLE_SOURCE state handler */
export type Input = z.infer<typeof inputSchema>;

export function setCooccurrences(articleIds: string[]) {
  return gql`
    mutation SetCooccurrences($articleIds: [String!]!) {
      CreateOrUpdateCooccurrence(articleIds: $articleIds) {
        id
      }
    }
  `({ articleIds });
}

const askingCooccurence: ChatbotPostbackHandler = async ({
  context,
  postbackData: { state, input: postbackInput },
  userId,
}) => {
  let input: Input;
  try {
    input = inputSchema.parse(postbackInput);
  } catch (e) {
    console.error('[askingCooccurence]', e);
    throw new ManipulationError(t`Please choose from provided options.`);
  }

  const visitor = ga(userId, state, `Batch: ${context.msgs.length} messages`);

  switch (input) {
    case POSTBACK_NO: {
      visitor
        .event({
          ec: 'UserInput',
          ea: 'IsCooccurrence',
          el: 'No',
        })
        .send();
      return {
        context,
        replies: [
          createTextMessage({
            text: t`Please send me the messages separately.`,
          }),
        ],
      };
    }

    case POSTBACK_YES: {
      visitor
        .event({
          ec: 'UserInput',
          ea: 'IsCooccurrence',
          el: 'Yes',
        })
        .send();

      const searchResults = await Promise.all(
        context.msgs.map(async (msg) =>
          msg.type === 'text'
            ? searchText(msg.text)
            : searchMedia(getLineContentProxyURL(msg.id), userId)
        )
      );

      const notInDbCount = searchResults.reduce((sum, result) => {
        const firstResult = result.edges[0];
        if (!firstResult) return sum + 1;

        return ('mediaSimilarity' in firstResult
          ? firstResult.mediaSimilarity
          : firstResult.similarity) >= IN_DB_THRESHOLD
          ? sum
          : sum + 1;
      }, 0);

      if (notInDbCount === 0) {
        // Get first few search results for each message, and make at most 10 options

        return {
          context,
          replies: [],
        };
      }

      return {
        context,
        // Ask if the user want to submit those are not in DB into the database
        replies: [],
      };
    }

    default:
      // exhaustive check
      return input satisfies never;
  }
};

export default askingCooccurence;
