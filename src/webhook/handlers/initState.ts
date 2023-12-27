import { t } from 'ttag';
import { FlexBubble, FlexMessage, Message, TextMessage } from '@line/bot-sdk';

import type {
  Result,
  Context,
  CooccurredMessage,
} from 'src/types/chatbotState';
import ga from 'src/lib/ga';
import detectDialogflowIntent from 'src/lib/detectDialogflowIntent';

import {
  createPostbackAction,
  ellipsis,
  POSTBACK_NO_ARTICLE_FOUND,
  createTextMessage,
  createArticleSourceReply,
  searchText,
  createTextCarouselContents,
} from './utils';
import choosingArticle from './choosingArticle';

const SIMILARITY_THRESHOLD = 0.95;

const initState = async ({
  context,
  userId,
}: {
  // Context initiated by text search
  context: Context & {
    msgs: ReadonlyArray<CooccurredMessage & { type: 'text' }>;
  };
  userId: string;
}): Promise<Result> => {
  const state = '__INIT__';
  let replies: Message[] = [];

  const input = context.msgs[0].text;

  // Track text message type send by user
  const visitor = ga(userId, state, input);
  visitor.event({
    ec: 'UserInput',
    ea: 'MessageType',
    el: 'text',
  });

  // send input to dialogflow before doing search
  // uses dialogflowResponse as reply only when there's a intent matched and
  // input.length <= 10 or input.length > 10 but intentDetectionConfidence == 1
  const dialogflowResponse = await detectDialogflowIntent(input);
  if (
    dialogflowResponse &&
    dialogflowResponse.queryResult &&
    dialogflowResponse.queryResult.intent &&
    (input.length <= 10 ||
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
    return { context, replies };
  }

  // Search for articles
  const result = await searchText(input);

  const inputSummary = ellipsis(input, 12);

  if (result.edges.length) {
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

    const hasIdenticalDocs = result.edges[0].similarity >= SIMILARITY_THRESHOLD;

    if (result.edges.length === 1 && hasIdenticalDocs) {
      visitor.send();

      return await choosingArticle({
        context,
        // choose for user
        postbackData: {
          sessionId: context.sessionId,
          state: 'CHOOSING_ARTICLE',
          input: result.edges[0].node.id,
        },
        userId,
      });
    }

    const articleOptions: FlexBubble[] = createTextCarouselContents(
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
      createArticleSourceReply(context.sessionId),
    ];
  }
  visitor.send();
  return { context, replies };
};

export default initState;
