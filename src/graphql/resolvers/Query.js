import UserArticleLink from 'src/database/models/userArticleLink';

export default {
  insights() {
    // Resolvers in next level
    return {};
  },

  context(root, args, context) {
    return context.userContext;
  },

  userArticleLinks(root, { skip, limit }, { userId }) {
    return UserArticleLink.find({ userId, skip, limit });
  },
};
