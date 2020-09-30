import gql from 'src/lib/gql';
import ga from 'src/lib/ga';
import { t } from 'ttag';
import {
  getArticleURL,
  UPVOTE_PREFIX,
  DOWNVOTE_PREFIX,
} from 'src/lib/sharedUtils';
import {
  createTypeWords,
  ellipsis,
  ManipulationError,
  FLEX_MESSAGE_ALT_TEXT,
} from './utils';

/**
 * @param {{vote: FeedbackVote, articleId: String, replyId: String, comment: String}} variables
 * @param {object} search
 * @returns {Promise<{reply: Object, feedbackCount: Number}>}
 */
async function updateFeedback(variables, search) {
  const { data, errors } = await gql`
    mutation UpdateFeedback(
      $vote: FeedbackVote!
      $articleId: String!
      $replyId: String!
      $comment: String
    ) {
      CreateOrUpdateArticleReplyFeedback(
        vote: $vote
        articleId: $articleId
        replyId: $replyId
        comment: $comment
      ) {
        reply {
          type
        }
        feedbackCount
      }
    }
  `(variables, search);

  if (errors) {
    throw new ManipulationError(
      t`Cannot record your feedback. Try again later?`
    );
  }

  return data.CreateOrUpdateArticleReplyFeedback;
}

export default async function askingReplyFeedback(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (!data.selectedReplyId) {
    throw new Error('selectedReply not set in data');
  }

  if (event.input.startsWith(UPVOTE_PREFIX)) {
    const updatedArticleReply = await updateFeedback(
      {
        articleId: data.selectedArticleId,
        replyId: data.selectedReplyId,
        vote: 'UPVOTE',
        comment: event.input.slice(UPVOTE_PREFIX.length),
      },
      { userId }
    );

    const articleText = ellipsis(data.selectedArticleText, 15);
    const replyType = createTypeWords(
      updatedArticleReply.reply.type
    ).toLowerCase();
    const articleUrl = getArticleURL(data.selectedArticleId);
    const sharedText = t`Someone says the message “${articleText}” ${replyType}.\n\nPlease refer to ${articleUrl} for more information, replies and references.`;

    const otherFeedbackCount = updatedArticleReply.feedbackCount - 1;
    const callToAction = t`Don't forget to forward the messages above to others and share with them!`;

    replies = [
      {
        type: 'text',
        text:
          otherFeedbackCount > 0
            ? t`We've received feedback from you and ${otherFeedbackCount} other users!`
            : t`Thanks. You're the first one who gave feedback on this reply!`,
      },
      {
        type: 'flex',
        altText: callToAction + '\n' + FLEX_MESSAGE_ALT_TEXT,
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
                text: callToAction,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'button',
                style: 'primary',
                color: '#ffb600',
                action: {
                  type: 'uri',
                  label: t`Share to friends`,
                  uri: `https://line.me/R/msg/text/?${encodeURI(sharedText)}`,
                },
              },
              {
                type: 'button',
                style: 'link',
                color: '#ffb600',
                action: {
                  type: 'uri',
                  label: t`See reported message`,
                  uri: getArticleURL(data.selectedArticleId),
                },
              },
            ],
          },
        },
      },
    ];
  } else if (event.input.startsWith(DOWNVOTE_PREFIX)) {
    const updatedArticleReply = await updateFeedback(
      {
        articleId: data.selectedArticleId,
        replyId: data.selectedReplyId,
        vote: 'DOWNVOTE',
        comment: event.input.slice(DOWNVOTE_PREFIX.length),
      },
      { userId }
    );

    const submissionUrl = getArticleURL(data.selectedArticleId);
    const otherFeedbackCount = updatedArticleReply.feedbackCount - 1;

    replies = [
      {
        type: 'text',
        text:
          otherFeedbackCount > 0
            ? t`We've received feedback from you and ${otherFeedbackCount} other users!`
            : t`Thanks. You're the first one who gave feedback on this reply!`,
      },
      {
        type: 'text',
        text: `💁 ${t`If you have a better reply, feel free to submit it to ${submissionUrl} .`}`,
      },
    ];
  }

  const visitor = ga(userId, state, data.selectedArticleText);

  // Track when user give feedback.
  visitor.event({
    ec: 'UserInput',
    ea: 'Feedback-Vote',
    el: `${data.selectedArticleId}/${data.selectedReplyId}`,
  });

  visitor.send();

  return { data, event, issuedAt, userId, replies, isSkipUser };
}
