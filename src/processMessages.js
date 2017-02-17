export default function processMessages(
  { state = '__INIT__', data = {} },
  event,
) {
  let replies;

  // Sets state, data and replies
  //
  switch (state) {
    case '__INIT__': {
      replies = [
        {
          type: 'text',
          text: event.message.text,
        },
      ];

      // Search for articles

      // Store articles
      // data.query = event.message.text;
      // data.foundArticles = [];

      // List found articles
      // replies = [];
      // state = 'CHOOSING_ARTICLE';
      break;
    }
    case 'CHOOSING_ARTICLE': {
      break;
    }
    case 'CHOOSING_REPLY': {
      break;
    }
    case 'ASKING_REPLY_FEEDBACK': {
      break;
    }
    case 'ASKING_ARTICLE_SUBMISSION': {
      break;
    }

    default:
      replies = [{
        type: 'text',
        text: '我們看不懂 QQ\n大俠請重新來過。',
      }];
  }

  return {
    context: { state, data },
    replies,
  };
}
