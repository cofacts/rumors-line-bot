import { t, msgid, ngettext } from 'ttag';
import ga from 'src/lib/ga';
import {
  getArticleURL,
  SOURCE_PREFIX_NOT_YET_REPLIED,
  REASON_PREFIX,
} from 'src/lib/sharedUtils';
import {
  ManipulationError,
  createArticleShareBubble,
  getArticleSourceOptionFromLabel,
  createReasonButtonFooter,
} from './utils';
import gql from 'src/lib/gql';

export default async function askingReplyRequestSubmission(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  if (event.input.startsWith(SOURCE_PREFIX_NOT_YET_REPLIED)) {
    const sourceOption = getArticleSourceOptionFromLabel(
      event.input.slice(SOURCE_PREFIX_NOT_YET_REPLIED.length)
    );

    const visitor = ga(userId, state, data.selectedArticleText);

    visitor.event({
      ec: 'UserInput',
      ea: 'ProvidingSource',
      el: sourceOption.value,
    });

    visitor.event({
      ec: 'Article',
      ea: 'ProvidingSource',
      el: `${data.selectedArticleId}/${sourceOption.value}`,
    });

    const articleUrl = getArticleURL(data.selectedArticleId);
    const sourceRecordedMsg = t`Thanks for the info.`;

    replies = [
      {
        type: 'flex',
        altText: sourceRecordedMsg,
        contents: {
          type: 'carousel',
          contents: [
            {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    wrap: true,
                    text: sourceRecordedMsg,
                  },
                ],
              },
              footer: createReasonButtonFooter(
                articleUrl,
                userId,
                data.sessionId
              ),
            },
            createArticleShareBubble(articleUrl),
          ],
        },
      },
    ];
    visitor.send();
    return { data, event, issuedAt, userId, replies, isSkipUser };
  } else if (event.input.startsWith(REASON_PREFIX)) {
    // Check required data to update reply request
    if (!data.selectedArticleId) {
      throw new ManipulationError(
        t`Please press the latest button to submit message to database.`
      );
    }

    // Update the reply request
    const { data: mutationData, errors } = await gql`
      mutation UpdateReplyRequest($id: String!, $reason: String) {
        CreateOrUpdateReplyRequest(articleId: $id, reason: $reason) {
          text
          replyRequestCount
        }
      }
    `(
      {
        id: data.selectedArticleId,
        reason: event.input.slice(REASON_PREFIX.length),
      },
      { userId }
    );

    if (errors) {
      throw new ManipulationError(
        t`Something went wrong when recording your reason, please try again later.`
      );
    }

    const visitor = ga(
      userId,
      state,
      mutationData.CreateOrUpdateReplyRequest.text
    );
    visitor.event({
      ec: 'Article',
      ea: 'ProvidingReason',
      el: data.selectedArticleId,
    });

    const articleUrl = getArticleURL(data.selectedArticleId);
    const otherReplyRequestCount =
      mutationData.CreateOrUpdateReplyRequest.replyRequestCount - 1;
    const replyRequestUpdatedMsg = t`Thanks for the info you provided.`;

    replies = [
      {
        type: 'flex',
        altText: replyRequestUpdatedMsg,
        contents: {
          type: 'carousel',
          contents: [
            createArticleShareBubble(articleUrl),
            {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    wrap: true,
                    text: replyRequestUpdatedMsg,
                  },
                  otherReplyRequestCount > 0 && {
                    type: 'text',
                    wrap: true,
                    text: ngettext(
                      msgid`There is ${otherReplyRequestCount} user also waiting for clarification.`,
                      `There are ${otherReplyRequestCount} users also waiting for clarification.`,
                      otherReplyRequestCount
                    ),
                  },
                ].filter(m => m),
              },
              footer: createReasonButtonFooter(
                articleUrl,
                userId,
                data.sessionId,
                true
              ),
            },
          ],
        },
      },
    ];
    visitor.send();

    return { data, event, userId, replies, isSkipUser };
  }
}
