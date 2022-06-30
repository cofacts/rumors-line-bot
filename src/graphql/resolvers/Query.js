import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';
import { processConnection } from '../utils/connection';

export default {
  insights() {
    // Resolvers in next level
    return {};
  },

  queue() {
    return [groupEventQueue, expiredGroupEventQueue];
  },

  setting(root, args, context) {
    const { userId } = context;
    return UserSettings.findOrInsertByUserId(userId);
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
