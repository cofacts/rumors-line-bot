import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import { processConnection } from '../utils/connection';

export default {
  insights() {
    // Resolvers in next level
    return {};
  },

  setting(root, args, context) {
    const { userId } = context;
    return UserSettings.findOrInsertByUserId(userId);
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
