import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import SendMessage from 'src/lib/sendMessage';
import { t } from 'ttag';

/**
 * From ListArticles api, get articleIdList that have new replies
 * between lastScannedAt and nowWithOffset.
 * From UserArticleLink, use articleId to find userId list.
 *
 * @param {string} lastScannedAt
 * @param {string} nowWithOffset
 * @returns {Object<userId, articleIdList>}
 */
const getNotificationList = async (lastScannedAt, nowWithOffset) => {
  const {
    data: { ListArticles },
  } = await gql`
    query ArticleRepliesBetween($from: String!, $to: String!) {
      ListArticles(
        filter: {
          repliedAt: {
            # last scaned at
            GT: $from
            # now - 12 hr
            LT: $to
          }
        }
        first: 100
        orderBy: { lastRepliedAt: DESC }
      ) {
        edges {
          node {
            id
            articleReplies {
              createdAt
            }
          }
        }
      }
    }
  `({
    from: lastScannedAt,
    to: nowWithOffset,
  });

  const result = {};
  await Promise.all(
    (ListArticles?.edges || []).map(async ({ node }) => {
      const articleId = node.id;
      if (!articleId) return;
      const userArticleLinks = await UserArticleLink.findUserListByArticleId(
        articleId
      );
      userArticleLinks.forEach(data => {
        const uid = data.userId;

        // return if user viewed the article
        // Note: Use articleReplies[0] here because in ListArticles the sort of
        // articleReplies is newest reply first then upvote count sort by desc.
        if (
          new Date(data.lastViewedAt) >
          new Date(node.articleReplies[0].createdAt)
        )
          return;

        if (!result[uid]) result[uid] = [];
        result[uid].push(articleId);
      });
    })
  );
  // console.log('[notify] notificationList :' + JSON.stringify(result));
  return result;
};

const sendNotification = async notificationList => {
  const message =
    t`There are new replies for the article you have searched. Click the link for more details:` +
    `${process.env.LIFF_URL}/liff/index.html?p=articles`;

  let userIdList = [];
  await Promise.all(
    Object.keys(notificationList).map(async key => {
      const setting = await UserSettings.findOrInsertByUserId(key);
      if (setting.allowNewReplyUpdate) {
        const visitor = ga(setting.userId);
        visitor.event({
          ec: 'Cron',
          ea: 'Send notification',
          el: notificationList[key],
        });
        visitor.send();
        userIdList.push(setting.userId);
        if (process.env.NOTIFY_METHOD == 'LINE_NOTIFY')
          SendMessage.notify(setting.newReplyNotifyToken, message);
      }
    })
  );

  if (userIdList.length)
    console.log('[notify] sends notification, user count:' + userIdList.length);

  if (process.env.NOTIFY_METHOD == 'PUSH_MESSAGE' && userIdList.length)
    SendMessage.multicast(userIdList, message);
};

export default {
  getNotificationList,
  sendNotification,
};
