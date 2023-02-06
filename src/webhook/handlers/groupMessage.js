// spec: https://github.com/cofacts/rumors-line-bot/issues/13
import stringSimilarity from 'string-similarity';
import { t } from 'ttag';
import gql from 'src/lib/gql';
import { createGroupReplyMessages } from './utils';
import ga from 'src/lib/ga';
import lineClient from 'src/webhook/lineClient';

const SIMILARITY_THRESHOLD = 0.8;
const INTRO_KEYWORDS = ['hi cofacts', 'hi confacts'];
const LEAVE_KEYWORD = 'bye bye cofacts';
const VALID_CATEGORIES = [
  'medical', //'疾病、醫藥🆕',
  'covid19', //'COVID-19 疫情🆕',
  'mz2n7nEBrIRcahlYnQpz', //'科技、資安、隱私',
  'lT3h7XEBrIRcahlYugqq', //'保健秘訣、食品安全',
  'nD2n7nEBrIRcahlYwQoW', //'免費訊息詐騙',
];

export default async function processText(event, groupId) {
  let replies;
  if (event.input === undefined) {
    throw new Error('input undefined');
  }

  // Track text message type send by user
  const visitor = ga(groupId, '__INIT__', event.input, event.source.type);

  const inputSimilarityWithIntro = Math.max(
    ...INTRO_KEYWORDS.map(keyword => {
      return stringSimilarity.compareTwoStrings(
        event.input.toLowerCase(),
        keyword
      );
    })
  );

  if (inputSimilarityWithIntro > 0.9) {
    replies = [
      {
        type: 'text',
        text: `${t`Hi i am cofacts chat bot`}😊 `,
      },
    ];
    visitor.event({
      ec: 'UserInput',
      ea: 'Intro',
      el: '',
    });
    visitor.send();
    return { event, groupId, replies };
  }

  if (event.input.toLowerCase() === LEAVE_KEYWORD) {
    await lineClient.post(`/${event.source.type}/${groupId}/leave`);
    return { event, groupId, replies };
  }

  // skip
  if (event.input.length <= 10) {
    return { event, groupId, replies: undefined };
  }

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
            articleCategories(status: NORMAL) {
              categoryId
              positiveFeedbackCount
              negativeFeedbackCount
            }
            articleReplies(status: NORMAL) {
              reply {
                id
                type
                text
                reference
              }
              positiveFeedbackCount
              negativeFeedbackCount
            }
          }
        }
      }
    }
  `({
    text: event.input,
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

    const hasIdenticalDocs =
      edgesSortedWithSimilarity[0].similarity >= SIMILARITY_THRESHOLD;
    const hasValidCategory = edgesSortedWithSimilarity[0].node.articleCategories.reduce(
      (acc, articleCategory) =>
        (acc =
          acc ||
          (VALID_CATEGORIES.includes(articleCategory.categoryId) &&
            articleCategory.positiveFeedbackCount >=
              articleCategory.negativeFeedbackCount)),
      false
    );

    if (hasIdenticalDocs) {
      const node = edgesSortedWithSimilarity[0].node;
      visitor.event({
        ec: 'Article',
        ea: 'Selected',
        el: node.id,
      });

      if (hasValidCategory) {
        const articleReply = getValidArticleReply(node);
        if (articleReply) {
          visitor.event({
            ec: 'Reply',
            ea: 'Selected',
            el: articleReply.reply.id,
          });

          replies = createGroupReplyMessages(
            event.input,
            articleReply.reply,
            node.articleReplies.length,
            node.id
          );
        }
      }
    }

    console.debug(
      '[GROUP]',
      JSON.stringify({
        similarities: edgesSortedWithSimilarity.map(({ similarity }) =>
          similarity.toFixed(2)
        ),
        hasIdenticalDocs,
        hasValidCategory,
        hasReply: !!replies,
      })
    );

    // sends ga only when article found
    visitor.send();
  }
  //else {
  // Article not found
  // }

  return { event, groupId, replies };
}

/**
 * Return a article reply which type is rumor.
 *
 * And to make sure there's no controversy,
 * It should
 * 1. check if rumor count >> non-rumor count when replyCount > 2
 * 2. candidate's positiveFeedbackCount > candidate's negativeFeedbackCount
 * 3. candidate's positiveFeedbackCount > non-rumors' positiveFeedbackCount
 *
 * @param {object} articleReplies `Article.articleReplies` from rumors-api
 * @returns {object} A reply which type is rumor
 */
export function getValidArticleReply({ articleReplies }) {
  let rumorCount = 0;
  const replyCount = articleReplies.length;
  const postiveArticleReplies = articleReplies
    .reduce((result, ar) => {
      if (ar.positiveFeedbackCount > ar.negativeFeedbackCount) {
        result.push(ar);
      }
      if (ar.reply.type === 'RUMOR') rumorCount++;
      return result;
    }, [])
    .sort(
      (reply1, reply2) =>
        reply2.positiveFeedbackCount - reply1.positiveFeedbackCount
    );

  // if replyCount > 2, check if rumorCount >= 2/3 replyCount
  if (replyCount <= 2 || rumorCount >= (replyCount * 2) / 3) {
    const candidate = postiveArticleReplies[0];

    // return `undefined` if first reply's type is not rumor
    if (!candidate || candidate.reply.type !== 'RUMOR') return undefined;

    // get first non-rumor articleReply (it may be undefined)
    const nonRumorAR = postiveArticleReplies.find(
      ar => ar.reply.type !== 'RUMOR'
    );

    // return candidate if its positiveFeedbackCount > first non-rumor articleReply
    if (
      nonRumorAR === undefined ||
      candidate.positiveFeedbackCount > nonRumorAR.positiveFeedbackCount
    )
      return candidate;
  }
  return undefined;
}
