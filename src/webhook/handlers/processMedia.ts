import { t } from 'ttag';
import type {
  FlexBubble,
  Message,
  FlexMessage,
  FlexComponent,
} from '@line/bot-sdk';
import { Context, CooccurredMessage } from 'src/types/chatbotState';

import {
  getLineContentProxyURL,
  createPostbackAction,
  POSTBACK_NO_ARTICLE_FOUND,
  createTextMessage,
  createAskArticleSubmissionConsentReply,
  createHighlightContents,
  searchMedia,
} from './utils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import choosingArticle from './choosingArticle';
import {
  ListArticlesInProcessMediaQuery,
  ListArticlesInProcessMediaQueryVariables,
} from 'typegen/graphql';

const CIRCLED_DIGITS = '⓪①②③④⑤⑥⑦⑧⑨⑩⑪';
const SIMILARITY_THRESHOLD = 0.95;

export default async function (message: CooccurredMessage, userId: string) {
  const proxyUrl = getLineContentProxyURL(message.id);
  console.log(`Media url: ${proxyUrl}`);

  const visitor = ga(userId, '__PROCESS_MEDIA__', proxyUrl);

  // Track media message type send by user
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: message.type });

  let replies;
  const context: Context = {
    // Start a new session
    sessionId: Date.now(),

    // Store user messageId into context, which will use for submit new image article
    msgs: [message],
  };

  const result = await searchMedia(proxyUrl, userId);

  if (result && result.edges.length) {
    // Track if find similar Articles in DB.
    visitor.event({ ec: 'UserInput', ea: 'ArticleSearch', el: 'ArticleFound' });

    // Track which Article is searched. And set tracking event as non-interactionHit.
    result.edges.forEach((edge) => {
      visitor.event({
        ec: 'Article',
        ea: 'Search',
        el: edge.node.id,
        ni: true,
      });
    });

    const edgesSortedWithSimilarity = [...result.edges].sort(
      (a, b) => b.mediaSimilarity - a.mediaSimilarity
    );

    const hasIdenticalDocs =
      edgesSortedWithSimilarity[0].mediaSimilarity >= SIMILARITY_THRESHOLD;

    if (result.edges.length === 1 && hasIdenticalDocs) {
      visitor.send();

      return await choosingArticle({
        context,
        // choose for user
        postbackData: {
          state: 'CHOOSING_ARTICLE',
          sessionId: context.sessionId,
          input: edgesSortedWithSimilarity[0].node.id,
        },
        userId,
      });
    }

    const articleOptions = result.edges
      .map(
        (
          {
            node: { attachmentUrl, id, articleType },
            highlight,
            mediaSimilarity,
          },
          index
        ): FlexBubble => {
          const displayTextWhenChosen = CIRCLED_DIGITS[index + 1];

          const { contents: highlightContents, source: highlightSource } =
            createHighlightContents(highlight);

          const similarityPercentage = Math.round(mediaSimilarity * 100);

          const looks =
            mediaSimilarity > 0
              ? t`Looks ${similarityPercentage}% similar`
              : highlightSource === null
              ? t`Similar file`
              : t`Contains relevant text`;

          const bodyContents: FlexComponent[] = [];

          if (highlightSource) {
            let highlightSourceInfo = '';
            switch (highlightSource) {
              case 'hyperlinks':
                highlightSourceInfo = t`(Text in the hyperlink)`;
                break;
              case 'text':
                if (articleType !== 'TEXT') {
                  highlightSourceInfo = t`(Text in transcript)`;
                }
            }

            if (highlightSourceInfo) {
              bodyContents.push({
                type: 'text',
                text: highlightSourceInfo,
                size: 'sm',
                color: '#ff7b7b',
                weight: 'bold',
              });
            }

            bodyContents.push({
              type: 'text',
              contents: highlightContents,
              // Show less lines if there are thumbnails to show
              maxLines: attachmentUrl ? 5 : 12,
              flex: 0,
              gravity: 'top',
              weight: 'regular',
              wrap: true,
            });
          }

          return {
            type: 'bubble',
            direction: 'ltr',
            header: {
              type: 'box',
              layout: 'horizontal',
              spacing: 'sm',
              paddingBottom: 'md',
              contents: [
                {
                  type: 'text',
                  text: displayTextWhenChosen + ' ' + looks,
                  gravity: 'center',
                  size: 'sm',
                  weight: 'bold',
                  wrap: true,
                  color: '#AAAAAA',
                },
              ],
            },

            // Show thumbnail image if available
            hero: !attachmentUrl
              ? undefined
              : {
                  type: 'image',
                  url: attachmentUrl,
                  size: 'full',
                },

            // Show highlighted text if available
            body:
              bodyContents.length === 0
                ? undefined
                : {
                    type: 'box',
                    layout: 'vertical',
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
                    t`I choose ${displayTextWhenChosen}`,
                    context.sessionId,
                    'CHOOSING_ARTICLE'
                  ),
                  style: 'primary',
                  color: '#ffb600',
                },
              ],
            },
          };
        }
      )
      .slice(0, 9); /* flex carousel has at most 10 bubbles */

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
                context.sessionId,
                'CHOOSING_ARTICLE'
              ),
              style: 'primary',
              color: '#ffb600',
            },
          ],
        },
      });
    }

    const templateMessage: FlexMessage = {
      type: 'flex',
      altText: t`Please choose the most similar message from the list.`,
      contents: {
        type: 'carousel',
        contents: articleOptions,
      },
    };

    const prefixTextArticleFound: Message[] = [
      {
        type: 'text',
        text: `🔍 ${t`There are some messages that looks similar to the one you have sent to me.`}`,
      },
    ];
    const textArticleFound: Message[] = [
      {
        type: 'text',
        text:
          t`Internet rumors are often mutated and shared.
            Please choose the version that looks the most similar` + '👇',
      },
      templateMessage,
    ];

    replies = prefixTextArticleFound.concat(textArticleFound);
  } else {
    visitor.event({
      ec: 'UserInput',
      ea: 'ArticleSearch',
      el: 'ArticleNotFound',
    });

    // submit
    replies = [
      createTextMessage({
        text:
          t`Unfortunately, I currently don’t recognize this message, but I would still like to help.` +
          '\n' +
          t`Do you want someone to fact-check this message?`,
      }),
      createAskArticleSubmissionConsentReply(context.sessionId),
    ];
  }
  visitor.send();
  return { context, replies };
}
