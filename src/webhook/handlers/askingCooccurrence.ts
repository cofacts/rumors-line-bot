import { z } from 'zod';
import { msgid, ngettext, t } from 'ttag';
import { FlexSpan } from '@line/bot-sdk';

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
  createPostbackAction,
  createCooccurredSearchResultsCarouselContents,
  setMostSimilarArticlesAsCooccurrence,
  addReplyRequestForUnrepliedCooccurredArticles,
} from './utils';

const inputSchema = z.enum([POSTBACK_NO, POSTBACK_YES]);

/** Minimum similarity for a CooccurredMessage to be considered as existing in DB */
const IN_DB_THRESHOLD = 0.8;

/** Postback input type for ASKING_ARTICLE_SOURCE state handler */
export type Input = z.infer<typeof inputSchema>;

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

      const notInDbMsgIndexes = searchResults.reduce((indexes, result, idx) => {
        const firstResult = result.edges[0];
        if (!firstResult) return [...indexes, idx];

        return ('mediaSimilarity' in firstResult
          ? firstResult.mediaSimilarity
          : firstResult.similarity) >= IN_DB_THRESHOLD
          ? indexes
          : [...indexes, idx];
      }, [] as number[]);

      if (notInDbMsgIndexes.length > 0) {
        // Ask if the user want to submit those are not in DB into the database
        const totalCount = context.msgs.length;
        const inDbStatus =
          notInDbMsgIndexes.length === totalCount
            ? t`None of the ${notInDbMsgIndexes.length} messages you sent are in the Cofacts database.`
            : ngettext(
                msgid`Out of the ${totalCount} messages you sent, ${notInDbMsgIndexes.length} is not in the Cofacts database.`,
                `Out of the ${totalCount} messages you sent, ${notInDbMsgIndexes.length} are not in the Cofacts database.`,
                notInDbMsgIndexes.length
              );

        const btnText = `🆕 ${t`Report to database`}`;
        const spans: FlexSpan[] = [
          {
            type: 'span',
            text: t`${inDbStatus} If you think they are most likely a rumor,`,
          },
          {
            type: 'span',
            text: t`press “${btnText}” to make this message public on Cofacts database `,
            color: '#ffb600',
            weight: 'bold',
          },
          {
            type: 'span',
            text: t`and have volunteers fact-check it. This way you can help the people who receive the same message in the future.`,
          },
        ];
        return {
          context,
          replies: [
            {
              type: 'flex',
              altText: t`Be the first to report the message`,
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'md',
                  paddingAll: 'lg',
                  contents: [
                    {
                      type: 'text',
                      wrap: true,
                      contents: spans,
                    },
                  ],
                },
              },
              quickReply: {
                items: [
                  {
                    type: 'action',
                    action: createPostbackAction(
                      btnText,
                      notInDbMsgIndexes,
                      btnText,
                      context.sessionId,
                      'ASKING_ARTICLE_SUBMISSION_CONSENT'
                    ),
                  },
                  {
                    type: 'action',
                    action: createPostbackAction(
                      t`Don’t report`,
                      [],
                      t`Don’t report`,
                      context.sessionId,
                      'ASKING_ARTICLE_SUBMISSION_CONSENT'
                    ),
                  },
                ],
              },
            },
          ],
        };
      }

      await Promise.all([
        // All messages in DB and thus can be set as cooccurrence.
        setMostSimilarArticlesAsCooccurrence(searchResults, userId),
        addReplyRequestForUnrepliedCooccurredArticles(searchResults, userId),
      ]);

      // Get first few search results for each message, and make at most 10 options
      //

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

    default:
      // exhaustive check
      return input satisfies never;
  }
};

export default askingCooccurence;
