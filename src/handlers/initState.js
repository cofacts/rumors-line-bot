import stringSimilarity from 'string-similarity';
import { t } from 'ttag';
import gql from '../gql';
import {
  createPostbackAction,
  isNonsenseText,
  ellipsis,
  ARTICLE_SOURCES,
} from './utils';
import ga from '../ga';

const SIMILARITY_THRESHOLD = 0.95;

export default async function initState(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

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
      .sort((edge1, edge2) => edge2.similarity - edge1.similarity);

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
        issuedAt,
        userId,
        replies,
        isSkipUser: true,
      };
    }

    const postMessage = edgesSortedWithSimilarity.map(
      ({ node: { text }, similarity }, idx) => {
        return {
          type: 'bubble',
          header: {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: `[${t`Similarity`}: ${(similarity * 100).toFixed(2) +
                  '%'}] \n`,
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
                text,
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
                  t`Choose this one`,
                  idx + 1,
                  issuedAt
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
        contents: [
          {
            type: 'text',
            text: ' ',
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
            action: createPostbackAction(t`Tell us more`, 0, issuedAt),
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
    if (isNonsenseText(event.input) && data.messageType === 'text') {
      // Track if find similar Articles in DB.
      visitor.event({
        ec: 'UserInput',
        ea: 'ArticleSearch',
        el: 'NonsenseText',
      });

      replies = [
        {
          type: 'text',
          text:
            '你傳的資訊太少，無法為你搜尋資料庫噢！\n' +
            '正確使用方式，請參考📖使用手冊 http://bit.ly/cofacts-line-users',
        },
      ];
      state = '__INIT__';
    } else {
      // Track if find similar Articles in DB.
      visitor.event({
        ec: 'UserInput',
        ea: 'ArticleSearch',
        el: 'ArticleNotFound',
      });

      data.articleSources = ARTICLE_SOURCES;

      // use `articleSummary` for text only because ocr may get wrong text from image
      let prefixTextArticleNotFound = '找不到關於相似的訊息耶 QQ\n';
      if (data.messageType === 'text') {
        prefixTextArticleNotFound = `找不到關於「${articleSummary}」訊息耶 QQ\n`;
      }
      const altText =
        prefixTextArticleNotFound +
        '\n' +
        '請問您是從哪裡看到這則訊息呢？\n' +
        '\n' +
        data.articleSources
          .map((option, index) => `${option} > 請傳 ${index + 1}\n`)
          .join('') +
        '\n' +
        '請按左下角「⌨️」鈕輸入選項編號。';

      replies = [
        {
          type: 'template',
          altText,
          template: {
            type: 'buttons',
            text: prefixTextArticleNotFound + `請問您是從哪裡看到這則訊息呢？`,
            actions: data.articleSources.map((option, index) =>
              createPostbackAction(option, index + 1, issuedAt)
            ),
          },
        },
      ];
      state = 'ASKING_ARTICLE_SOURCE';
    }
  }
  visitor.send();
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
