import { z } from 'zod';
import { msgid, ngettext, t } from 'ttag';

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
  setExactMatchesAsCooccurrence,
  addReplyRequestForUnrepliedCooccurredArticles,
  setReplyTokenCollectorMsg,
  displayLoadingAnimation,
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

      let processingCount = context.msgs.length;
      await setReplyTokenCollectorMsg(
        userId,
        t`Out of the ${context.msgs.length} message(s) you have submitted, I am still analyzing ${processingCount} of them.`
      );
      await displayLoadingAnimation(userId);

      let searchResults;
      try {
        searchResults = await Promise.all(
          context.msgs.map(async (msg) =>
            msg.type === 'text'
              ? searchText(msg.text)
              : searchMedia(getLineContentProxyURL(msg.id), userId)
          )
        );
      } /* istanbul ignore next */ catch (error) {
        console.error('[askingCooccurrence] Error searching media:', error);
        return {
          context,
          replies: [
            createTextMessage({
              text: t`Sorry, I encountered an error while analyzing the messages. Please try sending them to me again later.`,
            }),
          ],
        };
      }

          processingCount -= 1;
          // Update reply token collector message with latest number of messages that is still being analyzed
          await setReplyTokenCollectorMsg(
            userId,
            t`Out of the ${context.msgs.length} message(s) you have submitted, I am still analyzing ${processingCount} of them.`
          );

          return result;
        })
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

        const btnText = `🆕 ${t`Report to database`}`;
        return {
          context,
          replies: [
            {
              type: 'flex',
              altText: t`Be the first to report these messages`,
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
                      text:
                        notInDbMsgIndexes.length === totalCount
                          ? t`The ${notInDbMsgIndexes.length} messages that you have sent are not within the Cofacts database.`
                          : ngettext(
                              msgid`Out of the ${totalCount} messages you sent, ${notInDbMsgIndexes.length} is not within the Cofacts database.`,
                              `Out of the ${totalCount} messages you sent, ${notInDbMsgIndexes.length} are not within the Cofacts database.`,
                              notInDbMsgIndexes.length
                            ),
                    },
                    {
                      type: 'text',
                      wrap: true,
                      text: t`If you believe:`,
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '🤔',
                          flex: 0,
                          margin: 'none',
                        },
                        {
                          type: 'text',
                          wrap: true,
                          flex: 1,
                          margin: 'md',
                          contents: [
                            {
                              type: 'span',
                              text: /* t: If you believe ~ a rumor */ t`That they are most likely `,
                            },
                            {
                              type: 'span',
                              text: /* t: If you believe that it is most likely ~ */ t`rumors,`,
                              decoration: 'none',
                              color: '#ffb600',
                              weight: 'bold',
                            },
                          ],
                        },
                      ],
                      margin: 'md',
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      contents: [
                        {
                          type: 'text',
                          text: '🌐',
                          flex: 0,
                          margin: 'none',
                        },
                        {
                          type: 'text',
                          wrap: true,
                          flex: 1,
                          margin: 'md',
                          contents: [
                            {
                              type: 'span',
                              text: /* t: ~ make this messasge public */ t`And you are willing to `,
                            },
                            {
                              type: 'span',
                              text: /* t: and you are willing to ~ */ t`make these messages public`,
                              decoration: 'none',
                              color: '#ffb600',
                              weight: 'bold',
                            },
                          ],
                        },
                      ],
                      margin: 'md',
                    },
                    {
                      type: 'text',
                      wrap: true,
                      contents: [
                        {
                          type: 'span',
                          text: t`Press “${btnText}” to make these messages public on Cofacts website `,
                          color: '#ffb600',
                          weight: 'bold',
                        },
                        {
                          type: 'span',
                          text: t`and have volunteers fact-check it. This way you can help the people who receive the same message in the future.`,
                        },
                      ],
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
        // All messages in DB and can be extracted from search results, can be set as cooccurrence.
        setExactMatchesAsCooccurrence(searchResults, userId),
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
