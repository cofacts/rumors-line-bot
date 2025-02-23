import { t } from 'ttag';
import type { FlexMessage } from '@line/bot-sdk';

import { CooccurredMessage } from 'src/types/chatbotState';
import ga from 'src/lib/ga';

import {
  getLineContentProxyURL,
  createPostbackAction,
  POSTBACK_NO_ARTICLE_FOUND,
  createTextMessage,
  createAskArticleSubmissionConsentReply,
  searchMedia,
  createSearchResultCarouselContents,
  setReplyTokenCollectorMsg,
  displayLoadingAnimation,
  setNewContext,
} from './utils';
import choosingArticle from './choosingArticle';

const SIMILARITY_THRESHOLD = 0.95;

export default async function (message: CooccurredMessage, userId: string) {
  const proxyUrl = getLineContentProxyURL(message.id);
  console.log(`Media url: ${proxyUrl}`);

  const visitor = ga(userId, '__PROCESS_MEDIA__', proxyUrl);

  // Track media message type send by user
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: message.type });

  let replies;
  // Start a new session
  const context = await setNewContext(userId, {
    // Store user messageId into context, which will use for submit new image article
    msgs: [message],
  });

  await setReplyTokenCollectorMsg(
    userId,
    t`I am still analyzing the media file you have submitted.`
  );
  await displayLoadingAnimation(userId);

  let result;
  try {
    result = await searchMedia(proxyUrl, userId);
  } /* istanbul ignore next */ catch (error) {
    console.error('[processMedia] Error searching media:', error);
    visitor.event({
      ec: 'Error',
      ea: 'ProcessMedia',
      el: error instanceof Error ? error.message : 'Unknown error',
    });
    visitor.send();

    return {
      context,
      replies: [
        createTextMessage({
          text: t`Sorry, I encountered an error while processing your media. Please try again later.`,
        }),
      ],
    };
  }

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

    const hasIdenticalDocs =
      result.edges[0].mediaSimilarity >= SIMILARITY_THRESHOLD;

    if (result.edges.length === 1 && hasIdenticalDocs) {
      visitor.send();

      return await choosingArticle({
        context,
        // choose for user
        postbackData: {
          state: 'CHOOSING_ARTICLE',
          sessionId: context.sessionId,
          input: result.edges[0].node.id,
        },
        userId,
      });
    }

    const articleOptions = createSearchResultCarouselContents(
      result.edges,
      context.sessionId
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

    replies = [
      createTextMessage({
        text: `🔍 ${t`There are some messages that looks similar to the one you have sent to me.`}`,
      }),
      createTextMessage({
        text:
          t`Internet rumors are often mutated and shared.
            Please choose the version that looks the most similar` + '👇',
      }),
      templateMessage,
    ];
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
