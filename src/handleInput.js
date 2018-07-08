import initState from './handlers/initState';
import choosingArticle from './handlers/choosingArticle';
import choosingReply from './handlers/choosingReply';
import askingReplyFeedback from './handlers/askingReplyFeedback';
import askingArticleSubmission from './handlers/askingArticleSubmission';
import askingNotUsefulFeedback from './handlers/askingNotUsefulFeedback';
import defaultState from './handlers/defaultState';

/**
 * Given input event and context, outputs the new context and the reply to emit.
 * Invokes handlers with regard to the current state.
 *
 * State diagram: http://bit.ly/2hnnXjZ
 *
 * @param {Object<state, data>} context The current context of the bot
 * @param {*} event The input event
 * @param {*} issuedAt When this request is issued. Will be written in postback replies.
 * @param {*} userId LINE user ID that does the input
 */
export default async function handleInput(
  { state = '__INIT__', data = {} },
  event,
  issuedAt,
  userId
) {
  let replies;
  let isSkipUser = false;

  if (event.input === undefined) {
    throw new Error('input undefined');
  }

  if (event.input.length >= 3 && state !== 'ASKING_NOT_USEFUL_FEEDBACK') {
    // If input contains more than 3 words,
    // consider it as a new query and start over.
    data = {};
    state = '__INIT__';
  }

  let params = {
    data,
    state,
    event,
    issuedAt,
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
      case 'ASKING_NOT_USEFUL_FEEDBACK': {
        params = await askingNotUsefulFeedback(params);
        break;
      }
      case 'ASKING_ARTICLE_SUBMISSION': {
        params = await askingArticleSubmission(params);
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
