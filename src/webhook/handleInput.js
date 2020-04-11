import initState from './handlers/initState';
import choosingArticle from './handlers/choosingArticle';
import choosingReply from './handlers/choosingReply';
import askingReplyFeedback from './handlers/askingReplyFeedback';
import askingArticleSubmissionConsent from './handlers/askingArticleSubmissionConsent';
import askingReplyRequestReason from './handlers/askingReplyRequestReason';
import defaultState from './handlers/defaultState';
import { REASON_PREFIX, DOWNVOTE_PREFIX } from 'src/lib/sharedUtils';

/**
 * Given input event and context, outputs the new context and the reply to emit.
 * Invokes handlers with regard to the current state.
 *
 * State diagram: http://bit.ly/2hnnXjZ
 *
 * @param {Object<state, data>} context The current context of the bot
 * @param {*} event The input event
 * @param {*} userId LINE user ID that does the input
 */
export default async function handleInput(
  { state = '__INIT__', data = {} },
  event,
  userId
) {
  let replies;
  let isSkipUser = false;

  if (event.input === undefined) {
    throw new Error('input undefined');
  }

  if (
    event.type === 'message' &&
    !event.input.startsWith(REASON_PREFIX) &&
    !event.input.startsWith(DOWNVOTE_PREFIX)
  ) {
    // The user forwarded us an new message.
    // Create a new "search session" and reset state to `__INIT__`.
    //
    data = {
      // Used to determine button postbacks and GraphQL requests are from
      // previous sessions
      //
      sessionId: Date.now(),
    };
    state = '__INIT__';
  }

  let params = {
    data,
    state,
    event,
    userId,
    replies,
    isSkipUser,
  };

  // Sets state, data and replies
  //
  do {
    params.isSkipUser = false;
    switch (params.state) {
      case '__INIT__': {
        params = await initState(params);
        break;
      }
      case 'CHOOSING_ARTICLE': {
        params = await choosingArticle(params);
        break;
      }
      case 'CHOOSING_REPLY': {
        params = await choosingReply(params);
        break;
      }
      case 'ASKING_REPLY_FEEDBACK': {
        params = await askingReplyFeedback(params);
        break;
      }
      case 'ASKING_ARTICLE_SUBMISSION_CONSENT': {
        params = await askingArticleSubmissionConsent(params);
        break;
      }
      case 'ASKING_REPLY_REQUEST_REASON': {
        params = await askingReplyRequestReason(params);
        break;
      }
      default: {
        params = defaultState(params);
        break;
      }
    }
    ({ isSkipUser } = params);
  } while (isSkipUser);

  ({ state, data, replies } = params);

  return {
    context: { state, data },
    replies,
  };
}
