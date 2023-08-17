import stringSimilarity from 'string-similarity';
import { t } from 'ttag';
import {
  FlexBubble,
  FlexComponent,
  FlexMessage,
  TextMessage,
} from '@line/bot-sdk';
import type { ChatbotStateHandler } from 'src/types/chatbotState';
import gql from 'src/lib/gql';
import {
  createPostbackAction,
  ellipsis,
  POSTBACK_NO_ARTICLE_FOUND,
  createHighlightContents,
  createTextMessage,
  createArticleSourceReply,
} from './utils';
import ga from 'src/lib/ga';
import detectDialogflowIntent from 'src/lib/detectDialogflowIntent';
import choosingArticle from './choosingArticle';
import {
  ListArticlesInInitStateQuery,
  ListArticlesInInitStateQueryVariables,
} from 'typegen/graphql';

const SIMILARITY_THRESHOLD = 0.95;

const initState: ChatbotStateHandler = async (params) => {
  const { data, userId } = params;
  let { event, replies } = params;
  const state = '__INIT__';

  // Track text message type send by user
  const visitor = ga(userId, state, event.input);
  visitor.event({
    ec: 'UserInput',
    ea: 'MessageType',
    el: 'message' in event ? event.message.type : '',
  });

  // Store user input into context
  data.searchedText = event.input;

  // send input to dialogflow before doing search
  // uses dialogflowResponse as reply only when there's a intent matched and
  // input.length <= 10 or input.length > 10 but intentDetectionConfidence == 1
  const dialogflowResponse = await detectDialogflowIntent(data.searchedText);
  if (
    dialogflowResponse &&
    dialogflowResponse.queryResult &&
    dialogflowResponse.queryResult.intent &&
    (event.input.length <= 10 ||
      dialogflowResponse.queryResult.intentDetectionConfidence == 1)
  ) {
    replies = [
      {
        type: 'text',
        text: dialogflowResponse.queryResult.fulfillmentText ?? '',
      },
    ];
    visitor.event({
      ec: 'UserInput',
      ea: 'ChatWithBot',
      el: dialogflowResponse.queryResult.intent.displayName ?? undefined,
    });
    visitor.send();
    return { data, event, userId, replies };
  }

  // Search for articles
  const {
    data: { ListArticles },
  } = await gql`
    query ListArticlesInInitState($text: String!) {
      ListArticles(
        filter: { moreLikeThis: { like: $text } }
        orderBy: [{ _score: DESC }]
        first: 4
      ) {
        edges {
          node {
            text
            id
            articleType
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
  `<ListArticlesInInitStateQuery, ListArticlesInInitStateQueryVariables>({
    text: event.input,
  });

  const inputSummary = ellipsis(event.input, 12);

  if (ListArticles?.edges.length) {
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

    const edgesSortedWithSimilarity = ListArticles.edges
      .map((edge) => ({
        ...edge,
        similarity: stringSimilarity.compareTwoStrings(
          // Remove spaces so that we count word's similarities only
          //
          (edge.node.text ?? '').replace(/\s/g, ''),
          event.input.replace(/\s/g, '')
        ),
      }))
      .sort((edge1, edge2) => edge2.similarity - edge1.similarity)
      .slice(0, 9); /* flex carousel has at most 10 bubbles */

    const hasIdenticalDocs =
      edgesSortedWithSimilarity[0].similarity >= SIMILARITY_THRESHOLD;

    if (edgesSortedWithSimilarity.length === 1 && hasIdenticalDocs) {
      visitor.send();

      // choose for user
      event = {
        type: 'server_choose',
        input: edgesSortedWithSimilarity[0].node.id,
      };

      return await choosingArticle({
        data,
        state: 'CHOOSING_ARTICLE',
        event,
        userId,
        replies: [],
      });
    }

    const articleOptions: FlexBubble[] = edgesSortedWithSimilarity.map(
      ({ node: { text, id, articleType }, highlight, similarity }) => {
        const similarityPercentage = Math.round(similarity * 100);
        const similarityEmoji = ['😐', '🙂', '😀', '😃', '😄'][
          Math.floor(similarity * 4.999)
        ];
        const displayTextWhenChosen = ellipsis(text ?? '', 25, '...');

        const bodyContents: FlexComponent[] = [];

        const { contents: highlightContents, source: highlightSource } =
          createHighlightContents(highlight);

        let highlightSourceInfo = '';
        switch (highlightSource) {
          case 'hyperlinks':
            highlightSourceInfo = t`(Words found in the hyperlink)`;
            break;
          case 'text':
            if (articleType !== 'TEXT') {
              highlightSourceInfo = t`(Words found in transcript)`;
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

    const templateMessage: FlexMessage = {
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
      } satisfies TextMessage,
    ];
    const textArticleFound = [
      {
        type: 'text',
        text:
          t`Internet rumors are often mutated and shared.
            Please choose the version that looks the most similar` + '👇',
      } satisfies TextMessage,
      templateMessage,
    ];

    replies = [...prefixTextArticleFound, ...textArticleFound];
  } else {
    // Track if find similar Articles in DB.
    visitor.event({
      ec: 'UserInput',
      ea: 'ArticleSearch',
      el: 'ArticleNotFound',
    });

    replies = [
      createTextMessage({
        text:
          t`Unfortunately, I currently don’t recognize “${inputSummary}”, but I would still like to help.` +
          '\n' +
          t`May I ask you a quick question?`,
      }),
      createArticleSourceReply(data.sessionId),
    ];
  }
  visitor.send();
  return { data, event, userId, replies };
};

export default initState;
