import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import UserArticleLink from 'src/database/models/userArticleLink';
import UserSettings from 'src/database/models/userSettings';
import SendMessage from 'src/lib/sendMessage';
import { FLEX_MESSAGE_ALT_TEXT } from 'src/webhook/handlers/utils';
import { t } from 'ttag';

// Async generator that gets a batch of articles with articleReply between `from` and `to`.
// The generator encapsulates complex pagination logic so that the function using it can focus on
// batch processing logic without worrying pagination.
//
async function* getArticlesInBatch(from, to) {
  // Get pageInfo outside the loop since it's expensive for rumors-api
  const {
    data: {
      ListArticles: {
        pageInfo: { lastCursor },
      },
    },
  } = await gql`
    query ListArticlesStat($from: String!, $to: String!) {
      ListArticles(
        filter: { repliedAt: { GT: $from, LT: $to } }
        orderBy: { lastRepliedAt: DESC }
      ) {
        pageInfo {
          firstCursor
          lastCursor
        }
        totalCount
      }
    }
  `({ from, to });

  let after = null;
  while (lastCursor !== after) {
    // Actually loads `edges` and process.
    const {
      data: { ListArticles },
    } = await gql`
      query ArticleRepliesBetween(
        $from: String!
        $to: String!
        $after: String
      ) {
        ListArticles(
          filter: { repliedAt: { GT: $from, LT: $to } }
          after: $after
          first: 25
          orderBy: { lastRepliedAt: DESC }
        ) {
          edges {
            node {
              id
              articleReplies(status: NORMAL) {
                createdAt
              }
            }
            cursor
          }
        }
      }
    `({ from, to, after });

    yield ListArticles.edges.map(({ node }) => node);

    // next gql call should go after the last cursor of this page
    after = ListArticles.edges[ListArticles.edges.length - 1].cursor;
  }
}

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
  const result = {};

  // for loop ensures that only one batch will be processed at a time, so that we do not
  // make a bunch of queries to our MongoDB at once.
  //
  for await (const articles of getArticlesInBatch(
    lastScannedAt,
    nowWithOffset
  )) {
    // processes a batch of articleIds
    const userArticleLinks = await UserArticleLink.findByArticleIds(
      articles.map(({ id }) => id)
    );
    userArticleLinks.forEach(data => {
      const uid = data.userId;
      const node = articles.find(({ id }) => id === data.articleId);
      // return if user viewed the article
      // Note: Use articleReplies[0] here because in ListArticles the sort of
      // articleReplies is newest reply first then upvote count sort by desc.
      if (
        new Date(data.lastViewedAt) > new Date(node.articleReplies[0].createdAt)
      )
        return;

      if (!result[uid]) result[uid] = [];
      result[uid].push(data.articleId);
    });
  }
  console.log('[notify] notificationList :' + JSON.stringify(result));
  return result;
};

const sendNotification = async notificationList => {
  const message = t`There are new replies for the article you have searched. Click the link for more details:`;
  const url = `${process.env.LIFF_URL}/liff/index.html?p=articles`;

  let userIdList = [];
  const settings = await UserSettings.findByUserId(
    Object.keys(notificationList)
  );
  settings.forEach(setting => {
    if (setting.userId && setting.allowNewReplyUpdate) {
      userIdList.push(setting.userId);
      if (process.env.NOTIFY_METHOD == 'LINE_NOTIFY')
        SendMessage.notify(setting.newReplyNotifyToken, message + url);
    }
  });

  if (userIdList.length) {
    const visitor = ga('system');
    visitor.event({
      ec: 'Cronjob',
      ea: 'Send Notification',
      el: 'New replies in searched articles',
      ev: userIdList.length,
    });
    visitor.send();
    console.log('[notify] sends notification, user count:' + userIdList.length);
  }

  if (process.env.NOTIFY_METHOD == 'PUSH_MESSAGE' && userIdList.length)
    SendMessage.multicast([createNotifyFlexMessage(url)]);
};

function createNotifyFlexMessage(url) {
  const btnText = `🆕 ${t`View new replies`}`;
  const message = t`There are new replies for the article you have searched. Click the button for more details`;

  return {
    type: 'flex',
    altText: message + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            wrap: true,
            text: message,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#ffb600',
            action: {
              type: 'uri',
              label: btnText,
              uri: url,
            },
          },
        ],
      },
      styles: {
        body: {
          separator: true,
        },
      },
    },
  };
}

export default {
  getArticlesInBatch,
  getNotificationList,
  sendNotification,
  createNotifyFlexMessage,
};
