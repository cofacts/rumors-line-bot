export const twoFeedbacks = {
  data: {
    CreateOrUpdateArticleReplyFeedback: {
      feedbackCount: 2,
      reply: { type: 'NOT_ARTICLE' },
    },
  },
};

export const oneFeedback = {
  data: {
    CreateOrUpdateArticleReplyFeedback: {
      feedbackCount: 1,
      reply: { type: 'NOT_ARTICLE' },
    },
  },
};

export const error = {
  errors: [{ message: 'Some error' }],
};
