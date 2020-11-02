import { t } from 'ttag';
import {
  ellipsis,
  createPostbackAction,
  createReplyMessages,
  FLEX_MESSAGE_ALT_TEXT,
} from './utils';
import ga from 'src/lib/ga';

/**
 * Fixed inputs that indicate which reply should `tutorial` function return
 */
export const TUTORIAL_STEPS = {
  // From rich menu
  RICH_MENU: `📖 ${t`tutorial`}`,
  // From flex message button
  SIMULATE_FORWARDING_MESSAGE: t`Simulates forwarding a message`,
  // From quick reply, Note: it should be less than 20 charactors
  PROVIDE_PERMISSION_SETUP: `💡 ${t`Cool, I got it!`}`,
  EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP: `🤔 ${t`What happened?`}`,
  PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION: `❓ ${t`Why`}`,
  SETUP_DONE: `👌 ${t`Done!`}`,
  SETUP_LATER: `⏱️ ${t`Later`}`,
};

/**
 * @param {string} imageUrl
 * @param {string} text
 * @returns {object} Flex message contents object
 */
function createImageTextBubble(imageUrl, text) {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'image',
          url: imageUrl,
          size: 'full',
          aspectMode: 'cover',
          aspectRatio: '1:1',
          gravity: 'top',
        },
        {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: text,
              size: 'lg',
              weight: 'bold',
              wrap: true,
            },
          ],
          position: 'relative',
          offsetBottom: '0px',
          offsetStart: '0px',
          offsetEnd: '0px',
          paddingAll: '20px',
          paddingTop: '18px',
          flex: 1,
          justifyContent: 'center',
        },
      ],
      paddingAll: '0px',
    },
  };
}

/**
 * @param {string} label Act as quickReply's label and postback's input and displayText
 * @param {string} sessionId Search session ID
 * @param {string} postbackState Used by `handleInput` to determine which handler to call
 * @returns {object} quickReply items object
 */
function createQuickReplyPostbackItem(label, sessionId, postbackState) {
  return {
    type: 'action',
    action: createPostbackAction(label, label, label, sessionId, postbackState),
  };
}

/**
 * @returns {object} Flex message object
 */
export function createGreetingMessage() {
  const text = t`This is a chatbot that looks up suspicious forwarded messages for you. Here is how to use me:`;
  const imageUrl = `${process.env.RUMORS_LINE_BOT_URL}/static/img/greeting.png`;

  return {
    type: 'flex',
    altText: ellipsis(text, 300) + '\n' + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'carousel',
      contents: [createImageTextBubble(imageUrl, text)],
    },
  };
}

/**
 * @param {string} sessionId Search session ID
 * @returns {object} Flex message object
 */
export function createTutorialMessage(sessionId) {
  const textStep1 = `1. ${t`When receiving a message from elsewhere`}`;
  const textStep2 = `2. ${t`Long press and share`}`;
  const textStep3 = `3. ${t`Select Cofacts to share`}`;
  const textStep4 = `4. ${t`Cofacts replies with a crowd-sourced fact-check or chatbot replies`}`;

  const imageUrlStep1 = `${
    process.env.RUMORS_LINE_BOT_URL
  }/static/img/tutorial1.png`;
  const imageUrlStep2 = `${
    process.env.RUMORS_LINE_BOT_URL
  }/static/img/tutorial2.png`;
  const imageUrlStep3 = `${
    process.env.RUMORS_LINE_BOT_URL
  }/static/img/tutorial3.png`;
  const imageUrlStep4 = `${
    process.env.RUMORS_LINE_BOT_URL
  }/static/img/tutorial4.png`;

  const askForForwardingMessage = t`Wanna try it out? Just forward a message to me!`;
  const buttonLabel = TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE'];
  const displayText =
    '只要每天早上一杯地瓜葉牛奶。不僅有效降低三高，甚至連痛風也沒了；此外，地瓜葉牛奶的作法也很簡單，只要先將地瓜葉川燙過後，再加入鮮奶打成汁即可。';

  return {
    type: 'flex',
    altText:
      ellipsis(
        textStep1 + '\n' + textStep2 + '\n' + textStep3 + '\n' + textStep4,
        300
      ) +
      '\n' +
      FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'carousel',
      contents: [
        createImageTextBubble(imageUrlStep1, textStep1),
        createImageTextBubble(imageUrlStep2, textStep2),
        createImageTextBubble(imageUrlStep3, textStep3),
        createImageTextBubble(imageUrlStep4, textStep4),
        {
          type: 'bubble',
          body: {
            type: 'box',
            layout: 'vertical',
            contents: [
              {
                type: 'text',
                text: askForForwardingMessage,
                size: 'lg',
                weight: 'bold',
                wrap: true,
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'button',
                action: createPostbackAction(
                  buttonLabel,
                  TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE'],
                  displayText,
                  sessionId,
                  'TUTORIAL'
                ),
                style: 'primary',
                color: '#ffb600',
              },
            ],
          },
        },
      ],
    },
  };
}

/**
 * @returns {object} Flex message object
 */
function createEndingMessage() {
  const text = `${t`This is the end of the tutorial. Next time when you receive a suspicious message, don't hesitate to forward it to me!`} 🤗`;
  const imageUrl = `${
    process.env.RUMORS_LINE_BOT_URL
  }/static/img/endoftutorial.png`;

  return {
    type: 'flex',
    altText: ellipsis(text, 300) + '\n' + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'carousel',
      contents: [createImageTextBubble(imageUrl, text)],
    },
  };
}

/**
 * @param {string} sessionId Search session ID
 * @returns {object[]} message objects
 */
function createMockReplyMessages(sessionId) {
  const reply = {
    type: 'RUMOR',
    reference:
      'http://www.mygopen.com/2017/06/blog-post_26.html\n神奇的地瓜葉？搭配鮮奶遠離三高？謠言讓醫生說：有痛風或是腎臟不好的人要小心！',
    text:
      '基本上地瓜葉其實單吃就有效果，牛奶、豆漿可加可不加，民眾不用迷信。 三高或是糖尿病的患者還是要搭配醫生的治療，不能單靠吃地瓜葉就想將身體調養好，民眾千萬要注意。\n另外地瓜葉內還有鉀和鈉，對於有痛風或是腎臟不好的民眾反而會造成負擔，因此並不建議食用。',
  };
  const article = { replyCount: 1 };
  const selectedArticleId = '2sn80q5l5mzi0';

  const replies = createReplyMessages(reply, article, selectedArticleId);
  // put quickreply into last message
  replies[replies.length - 1]['quickReply'] = {
    items: [
      createQuickReplyPostbackItem(
        TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP'],
        sessionId,
        'TUTORIAL'
      ),
      createQuickReplyPostbackItem(
        TUTORIAL_STEPS['EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP'],
        sessionId,
        'TUTORIAL'
      ),
    ],
  };
  return replies;
}

/**
 * @param {string} message
 * @returns {object} Flex message object
 */
function createPermissionSetupDialog(message) {
  const buttonLabel = t`Setup permission`;
  const buttonUri = `${
    process.env.LIFF_URL
  }/liff/index.html?p=setting&utm_source=rumors-line-bot&utm_medium=tutorial`;

  return {
    type: 'flex',
    altText: ellipsis(message, 300) + '\n' + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'bubble',
      direction: 'ltr',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'none',
        margin: 'none',
        contents: [
          {
            type: 'text',
            contents: [
              {
                type: 'span',
                text: message,
              },
            ],
            flex: 0,
            gravity: 'top',
            weight: 'regular',
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: buttonLabel,
              uri: buttonUri,
            },
            style: 'primary',
            color: '#ffb600',
          },
        ],
      },
    },
  };
}

export default async function tutorial(params) {
  let { data, event, issuedAt, replies, userId, isSkipUser } = params;

  const replyProvidePermissionSetup = `${t`You are smart`} 😊`;
  const replySetupLater = t`OK. When we ask for feedback from you, the permission dialog will pop-up again.`;

  const askForPermissionSetup = t`To wrap up, please finish your permission settings so that I can provide a smoother experience.`;
  const explanPersmissionSetup = t`When I provide hoax-busting replies to you, I would like to ask you for any feedback on the crowd-sourced reply.
  In order to achieve that, I need to ask for your permission to "Send messages to chats".
  The permission will be used to send only this one message of yours back to this particular chatroom.
  You can still use Cofacts without granting me this permission. When we ask for feedback from you, the permission dialog will pop-up again.`;
  const explanChatbotFlow =
    `⬆️ ${t`What you see above is a simulation of what you may see after you forward a message to Cofacts.`}\n\n` +
    `📚 ${t`Cofacts has a database of hoax messages and replies.`}\n\n` +
    `📲 ${t`When you send a message to me, I look up the message in our database and return the results I found.`}\n\n` +
    `🆕 ${t`If I can't find anything, I will ask you about sending your message to that database.`}`;

  if (event.input === TUTORIAL_STEPS['RICH_MENU']) {
    replies = [];
    replies.push(await createTutorialMessage(data.sessionId));
  } else if (event.input === TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE']) {
    replies = await createMockReplyMessages(data.sessionId);
  } else if (event.input === TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP']) {
    replies = [
      {
        type: 'text',
        text: replyProvidePermissionSetup,
      },
    ];

    replies.push(await createPermissionSetupDialog(askForPermissionSetup));
    // put quickreply into last message
    replies[replies.length - 1]['quickReply'] = {
      items: [
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['SETUP_DONE'],
          data.sessionId,
          'TUTORIAL'
        ),
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['SETUP_LATER'],
          data.sessionId,
          'TUTORIAL'
        ),
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION'],
          data.sessionId,
          'TUTORIAL'
        ),
      ],
    };
  } else if (
    event.input ===
    TUTORIAL_STEPS['EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP']
  ) {
    replies = [
      {
        type: 'text',
        text: explanChatbotFlow,
      },
    ];

    replies.push(await createPermissionSetupDialog(askForPermissionSetup));
    // put quickreply into last message
    replies[replies.length - 1]['quickReply'] = {
      items: [
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['SETUP_DONE'],
          data.sessionId,
          'TUTORIAL'
        ),
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['SETUP_LATER'],
          data.sessionId,
          'TUTORIAL'
        ),
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION'],
          data.sessionId,
          'TUTORIAL'
        ),
      ],
    };
  } else if (
    event.input === TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION']
  ) {
    replies = [];
    replies.push(await createPermissionSetupDialog(explanPersmissionSetup));
    // put quickreply into last message
    replies[replies.length - 1]['quickReply'] = {
      items: [
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['SETUP_DONE'],
          data.sessionId,
          'TUTORIAL'
        ),
        createQuickReplyPostbackItem(
          TUTORIAL_STEPS['SETUP_LATER'],
          data.sessionId,
          'TUTORIAL'
        ),
      ],
    };
  } else if (event.input === TUTORIAL_STEPS['SETUP_DONE']) {
    replies = [];
    replies.push(createEndingMessage());
  } else if (event.input === TUTORIAL_STEPS['SETUP_LATER']) {
    replies = [
      {
        type: 'text',
        text: replySetupLater,
      },
    ];
    replies.push(createEndingMessage());
  } else {
    throw new Error('input undefined');
  }

  const visitor = ga(userId, 'TUTORIAL');
  visitor.event({
    ec: 'Tutorial',
    ea: 'Step',
    el: Object.keys(TUTORIAL_STEPS).find(
      key => TUTORIAL_STEPS[key] === event.input
    ),
  });
  visitor.send();

  return { data, event, issuedAt, userId, replies, isSkipUser };
}
