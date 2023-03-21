import { t } from 'ttag';
import {
  getLineContentProxyURL,
  createTextMessage,
  createAskArticleSubmissionConsentReply,
} from './utils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import choosingArticle from '../handlers/choosingArticle';

export default async function ({ data = {} }, event, userId) {
  const proxyUrl = getLineContentProxyURL(event.messageId);

  const visitor = ga(userId, '__PROCESS_MEDIA__', proxyUrl);
  // Track message type send by user
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: event.message.type });

  let replies;
  data = {
    // Start a new session
    sessionId: Date.now(),

    // Store user messageId into context, which will use for submit new media article
    searchedText: '',
    messageId: event.messageId,
    messageType: event.message.type,
  };

  const {
    data: { ListArticles },
  } = await gql`
    query ($mediaUrl: String!) {
      ListArticles(
        filter: {
          mediaUrl: $mediaUrl
          articleTypes: [TEXT, IMAGE, AUDIO, VIDEO]
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
        }
      }
    }
  `({
    mediaUrl: proxyUrl,
  });

  if (ListArticles.edges.length) {
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

    visitor.send();

    // choose for user
    event = {
      type: 'server_choose',
      input: ListArticles.edges[0].node.id,
    };

    ({ data, replies } = await choosingArticle({
      data,
      state: 'CHOOSING_ARTICLE',
      event,
      userId,
      replies: [],
    }));
    return { context: { data }, replies };
  }

  visitor.event({
    ec: 'UserInput',
    ea: 'ArticleSearch',
    el: 'ArticleNotFound',
  });

  // submit
  replies = [
    createTextMessage({
      text:
        t`Checking audio and video is still under construction. But I would still like to help.` +
        '\n' +
        t`Do you want someone to fact-check this message?`,
    }),
    createAskArticleSubmissionConsentReply(data.sessionId),
  ];
  visitor.send();
  return { context: { data }, replies };
}
