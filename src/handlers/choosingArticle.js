import gql from '../gql';
import { createPostbackAction, createFeedbackWords } from './utils';

export default async function choosingArticle(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.foundArticleIds) {
    throw new Error('foundArticleIds not set in data');
  }

  data.selectedArticleId = data.foundArticleIds[event.input - 1];
  const { selectedArticleId } = data;

  if (+event.input === 0) {
    replies = [
      {
        type: 'template',
        altText: '請問要將文章送出到資料庫嗎？\n「是」請輸入「y」，「否」請輸入「n」或其他單一字母。',
        template: {
          type: 'buttons',
          text: '請問要將文章送出到資料庫嗎？',
          actions: [
            createPostbackAction('是', 'y', issuedAt),
            createPostbackAction('否', 'n', issuedAt),
          ],
        },
      },
    ];

    state = 'ASKING_ARTICLE_SUBMISSION';
  } else if (!selectedArticleId) {
    replies = [
      { type: 'text', text: `請輸入 1～${data.foundArticleIds.length} 的數字，來選擇文章。` },
    ];

    state = 'CHOOSING_ARTICLE';
  } else {
    const { data: { GetArticle } } = await gql`
      query($id: String!) {
        GetArticle(id: $id) {
          replyCount
          replyConnections(status: NORMAL) {
            id
            reply {
              id
              versions(limit: 1) {
                type
                text
              }
            }
            feedbacks {
              comment
              score
            }
          }
        }
      }
    `({
      id: selectedArticleId,
    });

    const {
      rumorReplies,
      notRumorReplies,
    } = GetArticle.replyConnections.reduce(
      (result, { reply, feedbacks, id }) => {
        if (reply.versions[0].type === 'RUMOR') {
          result.rumorReplies.push({
            ...reply,
            feedbacks,
            replyConnectionId: id,
          });
        } else if (reply.versions[0].type === 'NOT_RUMOR') {
          result.notRumorReplies.push({
            ...reply,
            feedbacks,
            replyConnectionId: id,
          });
        }
        return result;
      },
      { rumorReplies: [], notRumorReplies: [] }
    );

    replies = [];

    if (notRumorReplies.length + rumorReplies.length !== 0) {
      data.foundReplies = notRumorReplies
        .concat(rumorReplies)
        .map(({ replyConnectionId, id }) => ({
          id,
          replyConnectionId,
        }));
      state = 'CHOOSING_REPLY';

      if (notRumorReplies.length + rumorReplies.length === 1) {
        // choose for user
        event.input = 1;

        return {
          data,
          state: 'CHOOSING_REPLY',
          event,
          issuedAt,
          userId,
          replies,
          isSkipUser: true,
        };
      }

      if (notRumorReplies.length) {
        replies.push({
          type: 'text',
          text: `這篇文章有 ${notRumorReplies.length} 個回應認為含有真實訊息：`,
        });
        replies.push({
          type: 'template',
          altText: notRumorReplies
            .map(
              (
                { versions, feedbacks },
                idx
              ) => `閱讀請傳 ${idx + 1}> ${createFeedbackWords(feedbacks)} \n ${versions[0].text.slice(0, 20)}`
            )
            .join('\n\n'),
          template: {
            type: 'carousel',
            columns: notRumorReplies.map(({ versions, feedbacks }, idx) => ({
              text: createFeedbackWords(feedbacks) +
                '\n' +
                versions[0].text.slice(0, 90),
              actions: [createPostbackAction('閱讀此回應', idx + 1, issuedAt)],
            })),
          },
        });
      }
      if (rumorReplies.length) {
        replies.push({
          type: 'text',
          text: `這篇文章有 ${rumorReplies.length} 個回應覺得有不實之處：`,
        });
        replies.push({
          type: 'template',
          altText: rumorReplies
            .map(
              (
                { versions, feedbacks },
                idx
              ) => `閱讀請傳 ${notRumorReplies.length + idx + 1}> ${createFeedbackWords(feedbacks)} \n ${versions[0].text.slice(0, 20)}`
            )
            .join('\n\n'),
          template: {
            type: 'carousel',
            columns: rumorReplies.map(({ versions, feedbacks }, idx) => ({
              text: createFeedbackWords(feedbacks) +
                '\n' +
                versions[0].text.slice(0, 80),
              actions: [
                createPostbackAction(
                  '閱讀此回應',
                  notRumorReplies.length + idx + 1,
                  issuedAt
                ),
              ],
            })),
          },
        });
      }
    } else if (GetArticle.replyCount !== 0) {
      // [replyCount !=0 && replies == 0]
      // Someone reported that it is not an article,
      // and there are no other replies available.
      // FIXME (ggm) very tricky if condition here
      replies = [
        {
          type: 'text',
          text: '有人認為您傳送的這則訊息並不是完整的文章內容，或認為「真的假的」不應該處理這則訊息。',
        },
        {
          type: 'text',
          text: `詳情請見：${process.env.SITE_URL}/article/${selectedArticleId}`,
        },
      ];
      state = '__INIT__';
    } else {
      // [replyCount ==0 && replies == 0]
      // No one has replied to this yet.
      const { data: { CreateReplyRequest }, errors } = await gql`
        mutation($id: String!) {
          CreateReplyRequest(articleId: $id) {
            replyRequestCount
          }
        }
      `({ id: selectedArticleId }, { userId });

      replies = [
        {
          type: 'text',
          text: `目前還沒有人回應這篇文章唷。${errors ? '' : `已經將您的需求記錄下來了，共有 ${CreateReplyRequest.replyRequestCount} 人跟您一樣渴望看到針對這篇文章的回應。`}`,
        },
        {
          type: 'text',
          text: `若有最新回應，會寫在這個地方：${process.env.SITE_URL}/article/${selectedArticleId}`,
        },
      ];

      state = '__INIT__';
    }
  }

  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
