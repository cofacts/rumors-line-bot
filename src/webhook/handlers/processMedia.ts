import { t, msgid, ngettext } from 'ttag';
import type {
  MessageEvent,
  FlexBubble,
  Message,
  FlexMessage,
  FlexComponent,
} from '@line/bot-sdk';
import { Context } from 'src/types/chatbotState';

import {
  getLineContentProxyURL,
  createPostbackAction,
  POSTBACK_NO_ARTICLE_FOUND,
  createTextMessage,
  createAskArticleSubmissionConsentReply,
  createHighlightContents,
} from './utils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import choosingArticle from './choosingArticle';
import {
  ListArticlesInProcessMediaQuery,
  ListArticlesInProcessMediaQueryVariables,
} from 'typegen/graphql';

/**
 * In rumors-api, hash similarity is boosted by 100.
 * Although text similarity also contributes to score, it's usually far less than 100.
 * Thus we take score >= 100 as "identical doc".
 *
 * @see https://g0v.hackmd.io/0tPABSZ6SRKswBYqAc1vZw#AI
 * @param score - Score that ListArticle provided in edge
 * @returns If the queried media should be considered as identical to a specific search result with that score
 */
function isIdenticalMedia(score: number | null) {
  return (score ?? 0) >= 100;
}

export default async function (
  { data = {} as Context },
  event: MessageEvent,
  userId: string
) {
  const proxyUrl = getLineContentProxyURL(event.message.id);
  // console.log(`Image url:  ${proxyUrl}`);

  const visitor = ga(userId, '__PROCESS_IMAGE__', proxyUrl);
  // Track text message type send by user
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: event.message.type });

  let replies;
  data = {
    // Start a new session
    sessionId: Date.now(),

    // Store user messageId into context, which will use for submit new image article
    searchedText: '',
    messageId: event.message.id,
    messageType: event.message.type,
  };

  const {
    data: { ListArticles },
  } = await gql`
    query ListArticlesInProcessMedia($mediaUrl: String!) {
      ListArticles(
        filter: {
          mediaUrl: $mediaUrl
          articleTypes: [TEXT, IMAGE, AUDIO, VIDEO]
          transcript: { shouldCreate: true }
        }
        orderBy: [{ _score: DESC }]
        first: 4
      ) {
        edges {
          score
          node {
            id
            articleType
            attachmentUrl(variant: THUMBNAIL)
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
  `<ListArticlesInProcessMediaQuery, ListArticlesInProcessMediaQueryVariables>({
    mediaUrl: proxyUrl,
  });

  if (ListArticles && ListArticles.edges.length) {
    // Track if find similar Articles in DB.
    visitor.event({ ec: 'UserInput', ea: 'ArticleSearch', el: 'ArticleFound' });

    // Track which Article is searched. And set tracking event as non-interactionHit.
    ListArticles.edges.forEach((edge) => {
      visitor.event({
        ec: 'Article',
        ea: 'Search',
        el: edge.node.id,
        ni: true,
      });
    });

    const hasIdenticalDocs = isIdenticalMedia(ListArticles.edges[0].score);

    if (ListArticles.edges.length === 1 && hasIdenticalDocs) {
      visitor.send();

      ({ data, replies } = await choosingArticle({
        data,
        state: 'CHOOSING_ARTICLE',
        event: {
          // choose for user
          type: 'server_choose',
          input: ListArticles.edges[0].node.id,
        },
        userId,
        replies: [],
      }));

      return { context: { data }, replies };
    }

    const articleOptions = ListArticles.edges
      .map(
        (
          { node: { attachmentUrl, id, articleType }, highlight, score },
          index
        ): FlexBubble => {
          const imgNumber = index + 1;
          const displayTextWhenChosen = ngettext(
            msgid`No.${imgNumber}`,
            `No.${imgNumber}`,
            imgNumber
          );

          const looks = isIdenticalMedia(score)
            ? t`Same file`
            : highlight === null
            ? t`Similar file`
            : t`Contains relevant text`;

          const bodyContents: FlexComponent[] = [];

          if (highlight) {
            const { contents: highlightContents, source: highlightSource } =
              createHighlightContents(highlight);

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
              maxLines: 6,
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
              spacing: 'md',
              paddingBottom: 'none',
              contents: [
                {
                  type: 'text',
                  text: displayTextWhenChosen + ', ' + looks,
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
      createAskArticleSubmissionConsentReply(data.sessionId),
    ];
  }
  visitor.send();
  return { context: { data }, replies };
}
