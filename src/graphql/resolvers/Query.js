import UserArticleLink from 'src/database/models/userArticleLink';
import { processConnection } from '../utils/connection';

export default {
  insights() {
    // Resolvers in next level
    return {};
  },

  context(root, args, context) {
    return context.userContext;
  },

  userArticleLinks(root, args, { userId }) {
    const orderBy = args.orderBy || { createdAt: -1 };
    return processConnection(UserArticleLink, {
      ...args,
      filter: { userId },
      orderBy,
    });
  },
};
