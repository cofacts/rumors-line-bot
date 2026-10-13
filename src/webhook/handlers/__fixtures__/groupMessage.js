const validArticleWithOneCategory = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text: 'WHO 最新研究顯示 Covid-19 其實源自黑暗料理界，即日起正名為「黑料病毒」',
            id: '3nbzf064ks60d',
            articleCategories: [
              {
                categoryId: 'covid19',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              },
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id',
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

const validArticleWithTwoCategories = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text: '你知道黑啤愛吃什麼嗎？ 黑啤愛吃蠶寶寶！',
            id: '3nbzf064ks60d',
            articleCategories: [
              {
                categoryId: 'covid19',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 1,
              },
              {
                categoryId: 'lT3h7XEBrIRcahlYugqq', //'保健秘訣、食品安全'
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              },
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id1',
                  type: 'RUMOR',
                  text: '這是謠言！這是謠言！這是謠言！這是謠言！',
                  reference: 'https://taiwanbar.cc/',
                },
                positiveFeedbackCount: 1,
                negativeFeedbackCount: 0,
              },
            ],
          },
        },
        {
          node: {
            text: '請問黑啤愛吃什麼？黑啤愛吃蠶寶寶',
            id: '8nbzf064ks87g',
            articleCategories: [
              {
                categoryId: 'covid19',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 1,
              },
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id2',
                  type: 'RUMOR',
                  text: '這是謠言！這是謠言！這是謠言！這是謠言！',
                  reference: 'https://taiwanbar.cc/',
                },
                positiveFeedbackCount: 1,
                negativeFeedbackCount: 0,
              },
            ],
          },
        },
        {
          node: {
            text: '以後吃蘋果一定要削皮。',
            id: '2zn1215x6e70v',
            articleCategories: [
              {
                category: {
                  id: 'intl',
                  positiveFeedbackCount: 0,
                  negativeFeedbackCount: 0,
                },
              }, //'跨國互動🆕'
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id3',
                  type: 'RUMOR',
                  text: '謠言說進口蘋果會上蠟，所以一定要削皮，但其實不用太擔心。蘋果自己本身就會產生蠟，為了增加保存期限，農家也會將蘋果上蠟。\n蘋果本身就會產生天然蠟來保護果肉，並不讓水分流失，這天然蠟還非常營養，富含花青素、槲皮素等等，能夠抵抗發炎、過敏等反應，而且不是只有蘋果會產生果蠟，還有許多水果，像是甘蔗、檸檬或是李子，也都會產生果蠟。',
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

const invalidCategoryFeedback = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text: '你知道嗎？其實黑啤愛吃蠶寶寶哦！',
            id: '3nbzf064ks60d',
            articleCategories: [
              {
                categoryId: 'covid19',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 1,
              },
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id',
                  type: 'RUMOR',
                  text: '這是謠言！這是謠言！這是謠言！這是謠言！',
                  reference: 'https://taiwanbar.cc/',
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

//{"edges":[{"node":{"text":"以後吃蘋果一定要削皮。","id":"2zn1215x6e70v","articleCategories":[{"category":{"title":"有意義但不包含在以上標籤 🚧"}}],"articleReplies":[{"reply":{"type":"RUMOR","text":"謠言說進口蘋果會上蠟，所以一定要削皮，但其實不用太擔心。蘋果自己本身就會產生蠟，為了增加保存期限，農家也會將蘋果上蠟。\n蘋果本身就會產生天然蠟來保護果肉，並不讓水分流失，這天然蠟還非常營養，富含花青素、槲皮素等等，能夠抵抗發炎、過敏等反應，而且不是只有蘋果會產生果蠟，還有許多水果，像是甘蔗、檸檬或是李子，也都會產生果蠟。","reference":"https://today.line.me/tw/v2/article/m1jBJn"},"positiveFeedbackCount":0,"negativeFeedbackCount":0}]}}]}
const invalidArticleCategory = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text: '以後吃蘋果一定要削皮。',
            id: '2zn1215x6e70v',
            articleCategories: [
              {
                categoryId: 'nT2n7nEBrIRcahlY6QqF',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'有意義但不包含在以上標籤 🚧'
              {
                categoryId: 'oD2o7nEBrIRcahlYFgpm',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'只有網址其他資訊不足 🚧'
              {
                categoryId: 'nj2n7nEBrIRcahlY-gpc',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'無意義 🚧'
              {
                categoryId: 'oj2o7nEBrIRcahlYRAox',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'連署、集氣、協尋、捐贈'
              {
                categoryId: 'oT2o7nEBrIRcahlYKQoM',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'政治、政黨'
              {
                categoryId: 'nz2o7nEBrIRcahlYBgqQ',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'商業廣告'
              {
                categoryId: 'mj2n7nEBrIRcahlYdArf',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'優惠措施、新法規、政策宣導'
              {
                categoryId: 'mT2n7nEBrIRcahlYTArI',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'環保、生態'
              {
                categoryId: 'kj287XEBrIRcahlYvQoS',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'中國影響力'
              {
                categoryId: 'mD2n7nEBrIRcahlYLAr7',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'電力、能源'
              {
                categoryId: 'lD3h7XEBrIRcahlYeQqS',
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              }, //'性別議題'
              {
                category: {
                  id: 'aids',
                  positiveFeedbackCount: 0,
                  negativeFeedbackCount: 0,
                },
              }, //'愛滋病🆕'
              {
                category: {
                  id: 'intl',
                  positiveFeedbackCount: 0,
                  negativeFeedbackCount: 0,
                },
              }, //'跨國互動🆕'
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id',
                  type: 'RUMOR',
                  text: '謠言說進口蘋果會上蠟，所以一定要削皮，但其實不用太擔心。蘋果自己本身就會產生蠟，為了增加保存期限，農家也會將蘋果上蠟。\n蘋果本身就會產生天然蠟來保護果肉，並不讓水分流失，這天然蠟還非常營養，富含花青素、槲皮素等等，能夠抵抗發炎、過敏等反應，而且不是只有蘋果會產生果蠟，還有許多水果，像是甘蔗、檸檬或是李子，也都會產生果蠟。',
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

const invalidArticleReply = {
  data: {
    ListArticles: {
      edges: [
        {
          node: {
            text: '我不會說我知道黑啤愛吃蠶寶寶哦！',
            id: '3nbzf064ks60d',
            articleCategories: [
              {
                categoryId: 'lT3h7XEBrIRcahlYugqq', //'保健秘訣、食品安全'
                positiveFeedbackCount: 0,
                negativeFeedbackCount: 0,
              },
            ],
            articleReplies: [
              {
                reply: {
                  id: 'fake-reply-id',
                  type: 'NOT_RUMOR',
                  text: '沒錯！正確答案',
                  reference: '我自己',
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

const notFound = {
  data: {
    ListArticles: {
      edges: [],
    },
  },
};

// ListArticles resolves to null when the GraphQL API returns a partial
// error (e.g. an upstream dependency failure) instead of throwing.
const nullListArticles = {
  data: {
    ListArticles: null,
  },
};

// article

/**
 * Non-RUMOR reply type
 */
const invalidReplyType = {
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
        text: 'OPINIONATED reply has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 4,
    },
  ],
};

const multipleReplies1 = {
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
        text: 'Rumor reply1 has second highest positiveFeedbackCount and equals to reply3',
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
        text: 'NOT_RUMOR reply has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 3,
      negativeFeedbackCount: 4,
    },
    {
      reply: {
        type: 'RUMOR',
        text: 'Rumor reply3 has second highest positiveFeedbackCount and equals to reply1',
      },
      positiveFeedbackCount: 2,
      negativeFeedbackCount: 0,
    },
  ],
};

const multipleReplies2 = {
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
        text: 'Rumor reply2 has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
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
        text: 'Rumor reply4 has highest positiveFeedbackCount, but negativeFeedbackCount > positiveFeedbackCount',
      },
      positiveFeedbackCount: 5,
      negativeFeedbackCount: 6,
    },
  ],
};

export const apiResult = {
  validArticleWithOneCategory,
  validArticleWithTwoCategories,
  invalidCategoryFeedback,
  invalidArticleCategory,
  invalidArticleReply,
  notFound,
  nullListArticles,
};
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
