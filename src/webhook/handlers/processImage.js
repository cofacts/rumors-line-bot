import { t, msgid, ngettext } from 'ttag';
import {
  getLineContentProxyURL,
  createPostbackAction,
  POSTBACK_NO_ARTICLE_FOUND,
} from './utils';
import gql from 'src/lib/gql';
import ga from 'src/lib/ga';

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
        filter: { mediaUrl: $mediaUrl }
        orderBy: [{ _score: DESC }]
        first: 4
      ) {
        edges {
          score
          node {
            id
            articleType
            attachmentUrl(variant: THUMBNAIL)
            attachmentHash
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

    const articleOptions = ListArticles.edges
      .map(({ node: { attachmentUrl, id }, score }, index) => {
        const imgNumber = index + 1;
        const displayTextWhenChosen = ngettext(
          msgid`No.${imgNumber}`,
          `No.${imgNumber}`,
          imgNumber
        );

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

    // Show "no-article-found" option
    //
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
    // submit
    console.log('Image not found, would you like to submit?');
  }
  visitor.send();
  return { context: { data }, replies };
}
