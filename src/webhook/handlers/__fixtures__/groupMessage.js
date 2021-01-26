const validArticleAndOneReply = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text:
              'WHO 最新研究顯示 Covid-19 其實源自黑暗料理界，即日起正名為「黑料病毒」',
            id: '3nbzf064ks60d',
            articleCategories: [{ category: { title: 'COVID-19 疫情🆕' } }],
            replyCount: 1,
            articleReplies: [
              {
                reply: {
                  type: 'RUMOR',
                  text: 'It`s rumor. It`s rumor. It`s rumor.',
                  reference: 'www.who.int',
                },
                positiveFeedbackCount: 1,
                negativeFeedbackCount: 0,
              },
            ],
          },
        },
      ],
    },
  },
};

//{"edges":[{"node":{"text":"以後吃蘋果一定要削皮。","id":"2zn1215x6e70v","articleCategories":[{"category":{"title":"有意義但不包含在以上標籤 🚧"}}],"replyCount":1,"articleReplies":[{"reply":{"type":"RUMOR","text":"謠言說進口蘋果會上蠟，所以一定要削皮，但其實不用太擔心。蘋果自己本身就會產生蠟，為了增加保存期限，農家也會將蘋果上蠟。\n蘋果本身就會產生天然蠟來保護果肉，並不讓水分流失，這天然蠟還非常營養，富含花青素、槲皮素等等，能夠抵抗發炎、過敏等反應，而且不是只有蘋果會產生果蠟，還有許多水果，像是甘蔗、檸檬或是李子，也都會產生果蠟。","reference":"https://today.line.me/tw/v2/article/m1jBJn"},"positiveFeedbackCount":0,"negativeFeedbackCount":0}]}}]}
const invalidArticle = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text: '以後吃蘋果一定要削皮。',
            id: '2zn1215x6e70v',
            articleCategories: [
              { category: { title: '有意義但不包含在以上標籤 🚧' } },
              { category: { title: '只有網址其他資訊不足 🚧' } },
              { category: { title: '無意義 🚧' } },
              { category: { title: '連署、集氣、協尋、捐贈' } },
              { category: { title: '政治、政黨' } },
              { category: { title: '商業廣告' } },
              { category: { title: '優惠措施、新法規、政策宣導' } },
              { category: { title: '環保、生態' } },
              { category: { title: '中國影響力' } },
              { category: { title: '電力、能源' } },
              { category: { title: '性別議題' } },
              { category: { title: '愛滋病🆕' } },
              { category: { title: '跨國互動🆕' } },
            ],
            replyCount: 1,
            articleReplies: [
              {
                reply: {
                  type: 'RUMOR',
                  text:
                    '謠言說進口蘋果會上蠟，所以一定要削皮，但其實不用太擔心。蘋果自己本身就會產生蠟，為了增加保存期限，農家也會將蘋果上蠟。\n蘋果本身就會產生天然蠟來保護果肉，並不讓水分流失，這天然蠟還非常營養，富含花青素、槲皮素等等，能夠抵抗發炎、過敏等反應，而且不是只有蘋果會產生果蠟，還有許多水果，像是甘蔗、檸檬或是李子，也都會產生果蠟。',
                  reference: 'https://today.line.me/tw/v2/article/m1jBJn',
                },
                positiveFeedbackCount: 100,
                negativeFeedbackCount: 0,
              },
            ],
          },
        },
      ],
    },
  },
};

const notFound = {
  data: {
    ListArticles: {
      edges: [],
    },
  },
};

// article

/**
 * Non-RUMOR reply type
 */
const invalidReplyType = {
  id: '3nbzf064ks60d',
  replyCount: 1,
  articleReplies: [
    {
      reply: {
        type: 'NOT_ARTICLE',
        text: 'NOT_ARTICLE reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * negativeFeedbackCount > positiveFeedbackCount
 */
const invalidReplyFeedbackCount = {
  id: '3nbzf064ks60d',
  replyCount: 1,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 3,
    },
  ],
};

const twoReplies1 = {
  id: '3nbzf064ks60d',
  replyCount: 2,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * equal positiveFeedbackCount, but both type are RUMOR
 */
const twoReplies2 = {
  id: '3nbzf064ks60d',
  replyCount: 2,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * Rumor reply1 has more positiveFeedbackCount
 */
const threeReplies1 = {
  id: '3nbzf064ks60d',
  replyCount: 3,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1 has more positiveFeedbackCount',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2 has less positiveFeedbackCount',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * OPINIONATED reply has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount
 * Rumor reply1 has second highest positiveFeedbackCount
 */
const threeReplies2 = {
  id: '3nbzf064ks60d',
  replyCount: 3,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1 has second highest positiveFeedbackCount',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2 has less positiveFeedbackCount',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text:
          'OPINIONATED reply has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 4,
    },
  ],
};

const multipleReplies1 = {
  id: '3nbzf064ks60d',
  replyCount: 6,
  articleReplies: [
    {
      reply: {
        type: 'NOT_ARTICLE',
        text: 'NOT_ARTICLE reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text:
          'Rumor reply1 has second highest positiveFeedbackCount and equals to reply3',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply3',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'NOT_RUMOR',
        text:
          'NOT_RUMOR reply has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 4,
    },
    {
      reply: {
        type: 'RUMOR',
        text:
          'Rumor reply3 has second highest positiveFeedbackCount and equals to reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
  ],
};

const multipleReplies2 = {
  id: '3nbzf064ks60d',
  replyCount: 6,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text:
          'Rumor reply2 has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 4,
      negativeFeedbackCount: 5,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply1',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply3 has second highest positiveFeedbackCount',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 2,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply4',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * Non-RUMOR type has heightest `positiveFeedbackCount`
 */
const invalidTwoReplies1 = {
  id: '3nbzf064ks60d',
  replyCount: 2,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * RUMOR positiveFeedbackCount equals to Non-RUMOR(OPINIONATED)
 */
const invalidTwoReplies2 = {
  id: '3nbzf064ks60d',
  replyCount: 2,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * Non-RUMOR type has heightest `positiveFeedbackCount`
 */
const invalidThreeReplies1 = {
  id: '3nbzf064ks60d',
  replyCount: 3,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * RUMOR positiveFeedbackCount equals to Non-RUMOR(OPINIONATED)
 */
const invalidThreeReplies2 = {
  id: '3nbzf064ks60d',
  replyCount: 3,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * rumorCount <= 2/3 replyCount
 */
const invalidMultipleReplies1 = {
  id: '3nbzf064ks60d',
  replyCount: 4,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply1',
      },
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 10,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply2',
      },
      positiveFeedbackCount: 0,
      negativeFeedbackCount: 10,
    },
  ],
};

/**
 * rumorCount <= 2/3 replyCount
 */
const invalidMultipleReplies2 = {
  id: '3nbzf064ks60d',
  replyCount: 6,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'NOT_ARTICLE',
        text: 'NOT_ARTICLE reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'NOT_RUMOR',
        text: 'NOT_RUMOR reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply3',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 0,
    },
  ],
};

/**
 * Rumor reply4 has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount
 * Non-RUMOR reply has second positiveFeedbackCount
 */
const invalidMultipleReplies3 = {
  id: '3nbzf064ks60d',
  replyCount: 6,
  articleReplies: [
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply2',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'OPINIONATED',
        text: 'OPINIONATED reply',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'RUMOR reply3',
      },
      positiveFeedbackCount: 1,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'NOT_RUMOR',
        text: 'NOT_RUMOR reply has second positiveFeedbackCount',
      },
      positiveFeedbackCount: 4,
      negativeFeedbackCount: 0,
    },
    {
      reply: {
        type: 'RUMOR',
        text:
          'Rumor reply4 has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 5,
      negativeFeedbackCount: 6,
    },
  ],
};

export const apiResult = { validArticleAndOneReply, invalidArticle, notFound };
export const article = {
  invalidReplyType,
  invalidReplyFeedbackCount,
  invalidTwoReplies1,
  invalidTwoReplies2,
  invalidThreeReplies1,
  invalidThreeReplies2,
  invalidMultipleReplies1,
  invalidMultipleReplies2,
  invalidMultipleReplies3,
  twoReplies1,
  twoReplies2,
  threeReplies1,
  threeReplies2,
  multipleReplies1,
  multipleReplies2,
};
