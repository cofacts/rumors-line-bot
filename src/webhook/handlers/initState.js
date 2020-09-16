import stringSimilarity from 'string-similarity';
import { t, msgid, ngettext } from 'ttag';
import gql from 'src/lib/gql';
import { REASON_PREFIX, getArticleURL } from 'src/lib/sharedUtils';
import {
  ManipulationError,
  createPostbackAction,
  ellipsis,
  createAskArticleSubmissionConsentReply,
  createSuggestOtherFactCheckerReply,
  POSTBACK_NO_ARTICLE_FOUND,
  createReasonButtonFooter,
  createArticleShareBubble,
  createHighlightContents,
} from './utils';
import ga from 'src/lib/ga';

const SIMILARITY_THRESHOLD = 0.95;

export default async function initState(params) {
  let { data, event, userId, replies, isSkipUser } = params;
  let state = '__INIT__';

  if (event.input.startsWith(REASON_PREFIX)) {
    // Check required data to update reply request
    if (!data.selectedArticleId) {
      throw new ManipulationError(
        t`Please press the latest button to submit message to database.`
      );
    }

    // Update the reply request
    const { data: mutationData, errors } = await gql`
      mutation UpdateReplyRequest($id: String!, $reason: String) {
        CreateOrUpdateReplyRequest(articleId: $id, reason: $reason) {
          text
          replyRequestCount
        }
      }
    `(
      {
        id: data.selectedArticleId,
        reason: event.input.slice(REASON_PREFIX.length),
      },
      { userId }
    );

    if (errors) {
      throw new ManipulationError(
        t`Something went wrong when recording your reason, please try again later.`
      );
    }

    const visitor = ga(
      userId,
      state,
      mutationData.CreateOrUpdateReplyRequest.text
    );
    visitor.event({
      ec: 'Article',
      ea: 'ProvidingReason',
      el: data.selectedArticleId,
    });

    const articleUrl = getArticleURL(data.selectedArticleId);
    const otherReplyRequestCount =
      mutationData.CreateOrUpdateReplyRequest.replyRequestCount - 1;
    const replyRequestUpdatedMsg = t`Thanks for the info you provided.`;

    replies = [
      {
        type: 'flex',
        altText: replyRequestUpdatedMsg,
        contents: {
          type: 'carousel',
          contents: [
            createArticleShareBubble(articleUrl),
            {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    wrap: true,
                    text: replyRequestUpdatedMsg,
                  },
                  otherReplyRequestCount > 0 && {
                    type: 'text',
                    wrap: true,
                    text: ngettext(
                      msgid`There is ${otherReplyRequestCount} user also waiting for clarification.`,
                      `There are ${otherReplyRequestCount} users also waiting for clarification.`,
                      otherReplyRequestCount
                    ),
                  },
                ].filter(m => m),
              },
              footer: createReasonButtonFooter(
                articleUrl,
                userId,
                data.sessionId,
                true
              ),
            },
          ],
        },
      },
    ];
    visitor.send();

    return { data, event, userId, replies, isSkipUser };
  }

  // Track text message type send by user
  const visitor = ga(userId, state, event.input);
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: event.message.type });

  // Store user input into context
  data.searchedText = event.input;

  // Search for articles
  const {
    data: { ListArticles },
  } = await gql`
    query($text: String!) {
      ListArticles(
        filter: { moreLikeThis: { like: $text } }
        orderBy: [{ _score: DESC }]
        first: 4
      ) {
        edges {
          node {
            text
            id
          }
          highlight {
            text
            hyperlinks {
              title
              summary
            }
          }
        }
      }
    }
  `({
    text: event.input,
  });

  const inputSummary = ellipsis(event.input, 12);

  if (ListArticles.edges.length) {
    // Track if find similar Articles in DB.
    visitor.event({ ec: 'UserInput', ea: 'ArticleSearch', el: 'ArticleFound' });

    // Track which Article is searched. And set tracking event as non-interactionHit.
    ListArticles.edges.forEach(edge => {
      visitor.event({
        ec: 'Article',
        ea: 'Search',
        el: edge.node.id,
        ni: true,
      });
    });

    const edgesSortedWithSimilarity = ListArticles.edges
      .map(edge => {
        edge.similarity = stringSimilarity.compareTwoStrings(
          // Remove spaces so that we count word's similarities only
          //
          edge.node.text.replace(/\s/g, ''),
          event.input.replace(/\s/g, '')
        );
        return edge;
      })
      .sort((edge1, edge2) => edge2.similarity - edge1.similarity)
      .slice(0, 9) /* flex carousel has at most 10 bubbles */;

    const hasIdenticalDocs =
      edgesSortedWithSimilarity[0].similarity >= SIMILARITY_THRESHOLD;

    if (edgesSortedWithSimilarity.length === 1 && hasIdenticalDocs) {
      // choose for user
      event.input = 1;

      visitor.send();
      return {
        data,
        state: 'CHOOSING_ARTICLE',
        event: {
          type: 'postback',
          input: edgesSortedWithSimilarity[0].node.id,
        },
        userId,
        replies,
        isSkipUser: true,
      };
    }

    const articleOptions = edgesSortedWithSimilarity.map(
      ({ node: { text, id }, highlight, similarity }) => {
        const similarityPercentage = Math.round(similarity * 100);
        const similarityEmoji = ['😐', '🙂', '😀', '😃', '😄'][
          Math.floor(similarity * 4.999)
        ];
        const displayTextWhenChosen = ellipsis(text, 25, '...');

        const bodyContents = [];
        if (highlight && !highlight.text) {
          bodyContents.push({
            type: 'text',
            text: t`(Words found in the hyperlink)`,
            size: 'sm',
            color: '#ff7b7b',
            weight: 'bold',
          });
        }
        bodyContents.push({
          type: 'text',
          contents: createHighlightContents(highlight, text), // 50KB for entire Flex carousel
          maxLines: 6,
          flex: 0,
          gravity: 'top',
          weight: 'regular',
          wrap: true,
        });

        return {
          type: 'bubble',
          direction: 'ltr',
          header: {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            paddingBottom: 'none',
            contents: [
              {
                type: 'text',
                text: similarityEmoji,
                flex: 0,
              },
              {
                type: 'text',
                text: t`Looks ${similarityPercentage}% similar`,
                gravity: 'center',
                size: 'sm',
                weight: 'bold',
                wrap: true,
                color: '#AAAAAA',
              },
            ],
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'none',
            margin: 'none',
            contents: bodyContents,
          },
          footer: {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: createPostbackAction(
                  t`Choose this one`,
                  id,
                  t`I choose “${displayTextWhenChosen}”`,
                  data.sessionId,
                  'CHOOSING_ARTICLE'
                ),
                style: 'primary',
                color: '#ffb600',
              },
            ],
          },
        };
      }
    );

    // Show "no-article-found" option only when no identical docs are found
    //
    if (!hasIdenticalDocs) {
      articleOptions.push({
        type: 'bubble',
        header: {
          type: 'box',
          layout: 'horizontal',
          paddingBottom: 'none',
          contents: [
            {
              type: 'text',
              text: '😶',
              margin: 'none',
              size: 'sm',
              weight: 'bold',
              color: '#AAAAAA',
            },
          ],
        },
        body: {
          type: 'box',
          layout: 'horizontal',
          spacing: 'none',
          margin: 'none',
          contents: [
            {
              type: 'text',
              text: t`None of these messages matches mine :(`,
              maxLines: 5,
              flex: 0,
              gravity: 'top',
              weight: 'regular',
              wrap: true,
            },
          ],
        },
        footer: {
          type: 'box',
          layout: 'horizontal',
          contents: [
            {
              type: 'button',
              action: createPostbackAction(
                t`Tell us more`,
                POSTBACK_NO_ARTICLE_FOUND,
                t`None of these messages matches mine :(`,
                data.sessionId,
                'CHOOSING_ARTICLE'
              ),
              style: 'primary',
              color: '#ffb600',
            },
          ],
        },
      });
    }

    const templateMessage = {
      type: 'flex',
      altText: t`Please choose the most similar message from the list.`,
      contents: {
        type: 'carousel',
        contents: articleOptions,
      },
    };

    const prefixTextArticleFound = [
      {
        type: 'text',
        text: `🔍 ${t`There are some messages that looks similar to "${inputSummary}" you have sent to me.`}`,
      },
    ];
    const textArticleFound = [
      {
        type: 'text',
        text:
          t`Internet rumors are often mutated and shared.
            Please choose the version that looks the most similar` + '👇',
      },
      templateMessage,
    ];
    if (event.message.type === 'image') {
      replies = textArticleFound;
    } else {
      replies = prefixTextArticleFound.concat(textArticleFound);
    }

    state = 'CHOOSING_ARTICLE';
  } else {
    // Track if find similar Articles in DB.
    visitor.event({
      ec: 'UserInput',
      ea: 'ArticleSearch',
      el: 'ArticleNotFound',
    });

    if (event.message.type === 'image') {
      replies = [
        {
          type: 'text',
          text: t`We didn't find anything about this image :(`,
        },
        createSuggestOtherFactCheckerReply(),
      ];
    } else {
      replies = [
        {
          type: 'text',
          text: t`We didn't find anything about "${inputSummary}" :(`,
        },
        createAskArticleSubmissionConsentReply(userId, data.sessionId),
      ];
      state = 'ASKING_ARTICLE_SUBMISSION_CONSENT';
    }
  }
  visitor.send();
  return { data, state, event, userId, replies, isSkipUser };
}
