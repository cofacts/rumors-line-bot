import stringSimilarity from 'string-similarity';
import gql from '../gql';
import { createPostbackAction } from './utils';

const SIMILARITY_THRESHOLD = 0.95;

export default async function initState(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  // Store user input into context
  data.searchedText = event.input;

  // Search for articles
  const { data: { ListArticles } } = await gql`
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

  const articleSummary = `${event.input.slice(0, 10)}${event.input.length > 10 ? '⋯⋯' : ''}`;

  if (ListArticles.edges.length) {
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
          ({ node: { text } }, idx) => `選擇請打 ${idx + 1}> ${text.slice(0, 20)}`
        )
        .concat(hasIdenticalDocs ? [] : ['若以上皆非，請打 0。'])
        .join('\n\n'),
      template: {
        type: 'carousel',
        columns: edgesSortedWithSimilarity
          .map(({ node: { text }, similarity }, idx) => ({
            text: `[相似度:${(similarity * 100).toFixed(2) + '%'}] \n ${text.slice(0, 100)}`,
            actions: [createPostbackAction('選擇此則', idx + 1, issuedAt)],
          }))
          .concat(
            hasIdenticalDocs
              ? []
              : [
                  {
                    text: '這裡沒有一篇是我傳的訊息。',
                    actions: [createPostbackAction('選擇', 0, issuedAt)],
                  },
                ]
          ),
      },
    };

    replies = [
      {
        type: 'text',
        text: `幫您查詢「${articleSummary}」的相關回應。`,
      },
      {
        type: 'text',
        text: '請問下列文章中，哪一篇是您剛才傳送的訊息呢？',
      },
      templateMessage,
    ];
    state = 'CHOOSING_ARTICLE';
  } else {
    replies = [
      {
        type: 'text',
        text: `找不到關於「${articleSummary}」文章耶 QQ`,
      },
      {
        type: 'template',
        altText: '請問要將這份文章送出到資料庫嗎？\n「是」請輸入「y」，「否」請輸入「n」或其他單一字母。',
        template: {
          type: 'buttons',
          text: '請問要將這份文章送出到資料庫嗎？',
          actions: [
            createPostbackAction('是', 'y', issuedAt),
            createPostbackAction('否', 'n', issuedAt),
          ],
        },
      },
    ];
    state = 'ASKING_ARTICLE_SUBMISSION';
  }
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
