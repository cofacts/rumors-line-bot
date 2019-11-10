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

    const templateMessage = {
      type: 'template',
      altText: edgesSortedWithSimilarity
        .map(
          ({ node: { text } }, idx) =>
            `選擇請打 ${idx + 1}> ${ellipsis(text, 20, '')}`
        )
        .concat(hasIdenticalDocs ? [] : ['若以上皆非，請打 0。'])
        .join('\n\n'),
      template: {
        type: 'carousel',
        columns: edgesSortedWithSimilarity
          .map(({ node: { text }, similarity }, idx) => ({
            text: ellipsis(
              `[${t`Similarity`}:${(similarity * 100).toFixed(2) +
                '%'}] \n ${(text, 115)}`,
              '⋯'
            ),
            actions: [
              createPostbackAction(t`Choose this one`, idx + 1, issuedAt),
            ],
          }))
          .concat(
            hasIdenticalDocs
              ? []
              : [
                  {
                    text: t`These messages don't match mine :(`,
                    actions: [
                      createPostbackAction(t`Choose this one`, 0, issuedAt),
                    ],
                  },
                ]
          ),
      },
    };

    replies = [
      {
        type: 'text',
        text: `🔍 ${t`There are some messages that looks similar to "${articleSummary}" you have sent to me.`}`,
      },
      {
        type: 'text',
        text:
          t`Internet rumors are often mutated and shared.\nPlease choose the version that looks the most similar` +
          '👇',
      },
      templateMessage,
    ];
    state = 'CHOOSING_ARTICLE';
  } else {
    if (isNonsenseText(event.input)) {
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
      const altText =
        `找不到關於「${articleSummary}」訊息耶 QQ\n` +
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
            text: `找不到關於「${articleSummary}」訊息耶 QQ\n請問您是從哪裡看到這則訊息呢？`,
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
