import { t, msgid, ngettext } from 'ttag';
import {
  getLineContentProxyURL,
  createPostbackAction,
  POSTBACK_NO_ARTICLE_FOUND,
  createTextMessage,
  createAskArticleSubmissionConsentReply,
} from './utils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import handlePostback from '../handlePostback';

export default async function({ data = {} }, event, userId) {
  const proxyUrl = getLineContentProxyURL(event.messageId);
  // console.log(`Image url:  ${proxyUrl}`);

  const visitor = ga(userId, '__PROCESS_IMAGE__', proxyUrl);
  // Track text message type send by user
  visitor.event({ ec: 'UserInput', ea: 'MessageType', el: event.message.type });

  let replies;
  data = {
    // Start a new session
    sessionId: Date.now(),
  };

  const {
    data: { ListArticles },
  } = await gql`
    query($mediaUrl: String!) {
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
    ListArticles.edges.forEach(edge => {
      visitor.event({
        ec: 'Article',
        ea: 'Search',
        el: edge.node.id,
        ni: true,
      });
    });

    const hasIdenticalDocs = ListArticles.edges[0].score === 2;
    if (ListArticles.edges.length === 1 && hasIdenticalDocs) {
      visitor.send();

      // choose for user
      event = {
        type: 'postback',
        input: ListArticles.edges[0].node.id,
      };
      return await handlePostback({ data }, 'CHOOSING_ARTICLE', event, userId);
    }

    const articleOptions = ListArticles.edges
      .map(({ node: { attachmentUrl, id }, score }, index) => {
        const imgNumber = index + 1;
        const displayTextWhenChosen = ngettext(
          msgid`No.${imgNumber}`,
          `No.${imgNumber}`,
          imgNumber
        );

        // ListArticle score is 1~2 for the current query; the variable part is the ID hash difference
        const similarity = score - 1;
        const scoreInPercent = Math.floor(similarity * 100);
        const similarityEmoji = ['😐', '🙂', '😀', '😃', '😄'][
          Math.floor(similarity * 4.999)
        ];
        const looks = ngettext(
          msgid`Looks ${scoreInPercent}% similar`,
          `Looks ${scoreInPercent}% similar`,
          scoreInPercent
        );

        //show url attachmentUrl
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
                text: displayTextWhenChosen + ', ' + looks,
                gravity: 'center',
                size: 'sm',
                weight: 'bold',
                wrap: true,
                color: '#AAAAAA',
              },
            ],
          },
          hero: {
            type: 'image',
            url: attachmentUrl,
            size: 'full',
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
      })
      .slice(0, 9) /* flex carousel has at most 10 bubbles */;

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
        text: `🔍 ${t`There are some messages that looks similar to the one you have sent to me.`}`,
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

    replies = prefixTextArticleFound.concat(textArticleFound);
  } else {
    visitor.event({
      ec: 'UserInput',
      ea: 'ArticleSearch',
      el: 'ArticleNotFound',
    });

    // Store user messageId into context, which will use for submit new image article
    data.searchedText = '';
    data.messageId = event.messageId;

    // submit
    replies = [
      createTextMessage({
        text:
          t`I am sorry you cannot find the information you are looking for.` +
          '\n' +
          t`Do you want someone to fact-check this message?`,
      }),
      createAskArticleSubmissionConsentReply(data.sessionId),
    ];
  }
  visitor.send();
  return { context: { data }, replies };
}
