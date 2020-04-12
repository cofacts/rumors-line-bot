import stringSimilarity from 'string-similarity';
import { t } from 'ttag';
import gql from 'src/lib/gql';
import {
  createPostbackAction,
  ellipsis,
  createAskArticleSubmissionConsent,
} from './utils';
import ga from 'src/lib/ga';

const SIMILARITY_THRESHOLD = 0.95;

export default async function initState(params) {
  let { data, state, event, userId, replies, isSkipUser } = params;

  // Track text message type send by user
  const visitor = ga(userId, state, event.input);
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: 'text' });

  // Store user input into context
  data.searchedText = event.input;
  // Store input message type to context for non-init states use
  data.messageType = event.message.type;

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
        }
      }
    }
  `({
    text: event.input,
  });

  const articleSummary = ellipsis(event.input, 12);

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

    // Store article ids
    data.foundArticleIds = edgesSortedWithSimilarity.map(
      ({ node: { id } }) => id
    );

    const hasIdenticalDocs =
      edgesSortedWithSimilarity[0].similarity >= SIMILARITY_THRESHOLD;

    if (edgesSortedWithSimilarity.length === 1 && hasIdenticalDocs) {
      // choose for user
      event.input = 1;

      visitor.send();
      return {
        data,
        state: 'CHOOSING_ARTICLE',
        event,
        userId,
        replies,
        isSkipUser: true,
      };
    }

    const postMessage = edgesSortedWithSimilarity.map(
      ({ node: { text }, similarity }, idx) => {
        const similarityPercentage = Math.round(similarity * 100);
        const similarityEmoji = ['😐', '🙂', '😀', '😃', '😄'][
          Math.floor(similarity * 4.999)
        ];
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
            layout: 'horizontal',
            spacing: 'none',
            margin: 'none',
            contents: [
              {
                type: 'text',
                text: ellipsis(text, 300, '...'), // 50KB for entire Flex carousel,
                maxLines: 6,
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
                  t`Choose this one`,
                  idx + 1,
                  data.sessionId
                ),
                style: 'primary',
              },
            ],
          },
        };
      }
    );
    postMessage.push({
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
            action: createPostbackAction(t`Tell us more`, 0, data.sessionId),
            style: 'primary',
          },
        ],
      },
    });

    const templateMessage = {
      type: 'flex',
      altText: t`Please choose the most similar message from the list.`,
      contents: {
        type: 'carousel',
        contents: postMessage,
      },
    };

    const prefixTextArticleFound = [
      {
        type: 'text',
        text: `🔍 ${t`There are some messages that looks similar to "${articleSummary}" you have sent to me.`}`,
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
    if (data.messageType === 'image') {
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

    replies = [
      {
        type: 'text',
        // use `articleSummary` for text only because ocr may get wrong text from image
        text:
          data.messageType === 'text'
            ? t`We didn't find anything about "${articleSummary}" :(`
            : t`We didn't find anything about that :(`,
      },
      ...createAskArticleSubmissionConsent(userId, data.sessionId),
    ];
    state = 'ASKING_ARTICLE_SUBMISSION_CONSENT';
  }
  visitor.send();
  return { data, state, event, userId, replies, isSkipUser };
}
