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

async function* getUserArticleLinksBatch(ids, limit = 20) {
  let result = [];
  let skip = 0;
  while (skip === 0 || result.length === limit) {
    result = await UserArticleLink.findByArticleIds(ids, { limit, skip });

    yield result;

    // next call should go after the last cursor of this page
    skip += limit;
  }
}

async function* getUserSettingsBatch(ids, limit = 20) {
  let result = [];
  let skip = 0;
  while (skip === 0 || result.length === limit) {
    result = await UserSettings.findByUserIds(ids, { limit, skip });

    yield result;

    // next call should go after the last cursor of this page
    skip += limit;
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
    for await (const userArticleLinks of getUserArticleLinksBatch(
      articles.map(({ id }) => id)
    )) {
      // processes a batch of articleIds
      userArticleLinks.forEach(data => {
        const uid = data.userId;
        const node = articles.find(({ id }) => id === data.articleId);
        // return if user viewed the article
        // Note: Use articleReplies[0] here because in ListArticles the sort of
        // articleReplies is newest reply first then upvote count sort by desc.
        if (
          new Date(data.lastViewedAt) >
          new Date(node.articleReplies[0].createdAt)
        )
          return;

        if (!result[uid]) result[uid] = [];
        result[uid].push(data.articleId);
      });
    }
    console.log(
      '[notify] Scanning articles, notification list user count: ',
      Object.keys(result).length
    );
  }
  // console.log('[notify] notificationList :' + JSON.stringify(result));
  return result;
};

// When using method LINE_NOTIFY, we guide user to go to chatbot instead of directly opening liff.
// It's because viewd_article liff will send messages to cofacts chat room.
const sendNotification = async notificationList => {
  const message = t`There are new replies for the articles you have searched. Please see 'View article' on cofacts chatbot(${
    process.env.LINE_FRIEND_URL
  }) menu.`;

  let userIdList = [];
  for await (const settings of getUserSettingsBatch(
    Object.keys(notificationList)
  )) {
    settings.forEach(setting => {
      if (setting.userId && setting.allowNewReplyUpdate) {
        userIdList.push(setting.userId);
        if (process.env.NOTIFY_METHOD == 'LINE_NOTIFY')
          SendMessage.notify(setting.newReplyNotifyToken, message);
      }
    });
  }
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
    SendMessage.multicast(userIdList, [createNotifyFlexMessage()]);
};

function createNotifyFlexMessage() {
  const btnText = `🆕 ${t`View new replies`}`;
  const message = t`There are new replies for the articles you have searched. Click the button for more details.`;
  const url = `${
    process.env.LIFF_URL
  }?p=articles&utm_source=rumors-line-bot&utm_medium=push`;

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
  getUserArticleLinksBatch,
  getNotificationList,
  sendNotification,
  createNotifyFlexMessage,
};
