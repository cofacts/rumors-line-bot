import UserSettings from 'src/database/models/userSettings';
import UserArticleLink from 'src/database/models/userArticleLink';
import { revokeNotifyToken } from '../lineClient';

export default {
  async allowNotification(root, args, context) {
    const { allow } = args;
    const { userId } = context;
    let result = await UserSettings.setAllowNewReplyUpdate(userId, allow);
    const lineNotifyToken = result.newReplyNotifyToken;

    // revoke when user turns off notification and there exists lineNotifyToken
    if (!allow && lineNotifyToken) {
      revokeNotifyToken(lineNotifyToken);
      result = await UserSettings.setNewReplyNotifyToken(userId, null);
    }
    return result;
  },

  setViewed(root, args, context) {
    const { articleId } = args;
    const { userId } = context;

    return UserArticleLink.createOrUpdateByUserIdAndArticleId(
      userId,
      articleId,
      {
        lastViewedAt: new Date(),
      }
    );
  },
};
