import { t, msgid, ngettext } from 'ttag';
import GraphemeSplitter from 'grapheme-splitter';
import { sign } from 'src/lib/jwt';
import {
  ARTICLE_SOURCE_OPTIONS,
  getArticleURL,
  createTypeWords,
} from 'src/lib/sharedUtils';

const splitter = new GraphemeSplitter();

/**
 * @param {string} label - Postback action button text, max 20 words
 * @param {string} input - Input when pressed
 * @param {string} displayText - Text to display in chat window.
 * @param {string} sessionId - Current session ID
 * @param {string} state - the state that processes the postback
 */
export function createPostbackAction(
  label,
  input,
  displayText,
  sessionId,
  state
) {
  return {
    type: 'postback',
    label,
    displayText,
    data: JSON.stringify({
      input,
      sessionId,
      state,
    }),
  };
}

/**
 * @param {number} positive - Count of positive feedbacks
 * @param {number} negative - Count of negative feedbacks
 * @return {string} Description of feedback counts
 */
export function createFeedbackWords(positive, negative) {
  if (positive + negative === 0) return t`No feedback yet`;
  let result = '';
  if (positive)
    result +=
      '👍 ' +
      ngettext(
        msgid`${positive} user considers this helpful`,
        `${positive} users consider this helpful`,
        positive
      ) +
      '\n';
  if (negative)
    result +=
      '😕 ' +
      ngettext(
        msgid`${negative} user consider this not useful`,
        `${negative} users consider this not useful`,
        negative
      ) +
      '\n';
  return result.trim();
}

/**
 * @param {string} text - The text to show in flex message, text type
 * @return {string} The truncated text
 */
export function createFlexMessageText(text = '') {
  // Actually the upper limit is 2000, but 100 should be enough
  // because we only show the first line
  return ellipsis(text, 100, '');
}

/**
 * @param {object} reply The reply object
 * @param {string} reply.reference
 * @param {string} reply.type
 * @returns {string} The reference message to send
 */
export function createReferenceWords({ reference, type }) {
  const prompt = type === 'OPINIONATED' ? t`different opinions` : t`references`;

  if (reference) return `${prompt}：${reference}`;
  return `\uDBC0\uDC85 ⚠️️ ${t`This reply has no ${prompt} and it may be biased`} ⚠️️  \uDBC0\uDC85`;
}

const LIFF_EXP_SEC = 86400; // LIFF JWT is only valid for 1 day

/**
 * @param {'source'|'reason'|'feedback'} page - The page to display
 * @param {string} userId - LINE user ID
 * @param {string} sessionId - The current session ID
 * @returns {string}
 */
export function getLIFFURL(page, userId, sessionId) {
  const jwt = sign({
    sessionId,
    sub: userId,
    exp: Math.round(Date.now() / 1000) + LIFF_EXP_SEC,
  });

  return `${process.env.LIFF_URL}?p=${page}&token=${jwt}`;
}

export const FLEX_MESSAGE_ALT_TEXT = `📱 ${
  /* t: Flex message alt-text */ t`Please proceed on your mobile phone.`
}`;

/**
 * @param {string} userId - LINE user ID
 * @param {string} sessionId - Search session ID
 * @returns {object} reply message object with button that opens source LIFF
 */
export function createAskArticleSubmissionConsentReply(userId, sessionId) {
  const titleText = `🥇 ${t`Be the first to report the message`}`;
  const btnText = `🆕 ${t`Submit to database`}`;
  const spans = [
    {
      type: 'span',
      text: t`Currently we don't have this message in our database. If you think it is probably a rumor, `,
    },
    {
      type: 'span',
      text: t`press “${btnText}” to make this message public on Cofacts database `,
      color: '#ffb600',
      weight: 'bold',
    },
    {
      type: 'span',
      text: t`for nice volunteers to fact-check. Although you won't receive answers rightaway, you can help the people who receive the same message in the future.`,
    },
  ];

  return {
    type: 'flex',
    altText: titleText + '\n' + FLEX_MESSAGE_ALT_TEXT,
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            text: '🥇',
            flex: 0,
            gravity: 'center',
          },
          {
            type: 'text',
            text: t`Be the first to report the message`,
            weight: 'bold',
            color: '#ffb600',
            wrap: true,
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: 'lg',
        contents: [
          {
            type: 'text',
            wrap: true,
            contents: spans,
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
              uri:
                getLIFFURL('source', userId, sessionId) +
                `&article_submission=true`,
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

/**
 * @param {string} text
 * @param {number} limit
 * @return {string} if the text length is lower than limit, return text; else, return
 *                  text with ellipsis.
 */
export function ellipsis(text, limit, ellipsis = '⋯⋯') {
  if (splitter.countGraphemes(text) < limit) return text;

  return (
    splitter
      .splitGraphemes(text)
      .slice(0, limit - ellipsis.length)
      .join('') + ellipsis
  );
}

/**
 * @param {string} articleUrl
 * @param {string} reason
 * @returns {object} Reply object with sharing buttings
 */
export function createArticleShareBubble(articleUrl) {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          wrap: true,
          text: t`Your friends may know the answer 🌟 Share your question to friends, maybe someone can help!`,
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
          action: {
            type: 'uri',
            label: t`Share on LINE`,
            uri: `line://msg/text/?${encodeURIComponent(
              t`Please help me verify if this is true: ${articleUrl}`
            )}`,
          },
          style: 'primary',
          color: '#ffb600',
        },
        {
          type: 'button',
          action: {
            type: 'uri',
            label: t`Share on Facebook`,
            uri: `https://www.facebook.com/dialog/share?openExternalBrowser=1&app_id=${
              process.env.FACEBOOK_APP_ID
            }&display=popup&hashtag=${encodeURIComponent(
              `#${/* t: Facebook hash tag */ t`ReportedToCofacts`}`
            )}&href=${encodeURIComponent(articleUrl)}`,
          },
          style: 'primary',
          color: '#ffb600',
        },
      ],
    },
  };
}

/**
 * @returns {object} Bubble object that asks user to turn on notification
 */
export function createNotificationSettingsBubble() {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      paddingBottom: 'none',
      contents: [
        {
          type: 'text',
          wrap: true,
          text: `🔔  ${t`Receive updates`}`,
        },
      ],
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          wrap: true,
          text: t`You can turn on notification if you want Cofacts to notify you when someone replies this message.`,
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
          action: {
            type: 'uri',
            label: t`Go to settings`,
            uri: `${
              process.env.LIFF_URL
            }?p=setting&utm_source=rumors-line-bot&utm_medium=reply-request`,
          },
          style: 'primary',
          color: '#00B172',
        },
      ],
    },
  };
}

/**
 * Exception for unexpected input, thrown in handlers.
 * This will be catched and the instructions will be used as a reply to the user.
 */
export class ManipulationError extends Error {
  /**
   *
   * @param {string} instruction - A message telling user why the manipulation is wrong and what they
   *                               should do instead.
   */
  constructor(instruction) {
    super(instruction);
  }
}

/**
 * Exception for processsing requests timeout
 */
export class TimeoutError extends Error {
  /**
   *
   * @param {string} instruction
   */
  constructor(instruction) {
    super(instruction);
  }
}

/**
 * @param {string} articleSourceOptionLabel - Label in ARTICLE_SOURCE_OPTIONS
 * @returns {object} selected item in ARTICLE_SOURCE_OPTIONS
 */
export function getArticleSourceOptionFromLabel(articleSourceOptionLabel) {
  const option = ARTICLE_SOURCE_OPTIONS.find(
    ({ label }) => label === articleSourceOptionLabel
  );

  if (!option) {
    throw new ManipulationError(
      t`Please tell us where you have received the message using the options we provided.`
    );
  }

  return option;
}

const MANUAL_FACT_CHECKERS = [
  {
    label: 'MyGoPen 賣擱騙',
    value: 'line://ti/p/%40mygopen',
  },
  {
    label: '蘭姆酒吐司',
    value: 'line://ti/p/%40rumtoast',
  },
];
/**
 * @returns {object} Reply object with buttons that goes to other fact checkers
 */
export function createSuggestOtherFactCheckerReply() {
  const suggestion = t`We suggest forwarding the message to the following fact-checkers instead. They have 💁 1-on-1 Q&A service to respond to your questions.`;
  return {
    type: 'flex',
    altText: `${suggestion}\n\n${FLEX_MESSAGE_ALT_TEXT}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: suggestion,
            wrap: true,
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: MANUAL_FACT_CHECKERS.map(({ label, value }) => ({
          type: 'button',
          action: {
            type: 'uri',
            label,
            uri: value,
          },
          style: 'primary',
          color: '#333333',
        })),
      },
      styles: {
        body: {
          separator: true,
        },
      },
    },
  };
}

/**
 *
 * @param {string} articleUrl
 * @param {string} userId
 * @param {string} sessionId
 * @param {boolean} isUpdating
 * @returns {object} Flex bubble message's footer object
 */
export function createReasonButtonFooter(
  articleUrl,
  userId,
  sessionId,
  isUpdating = false
) {
  // Updating is not call-to-action, use normal gray
  const color = isUpdating ? '#333333' : '#ffb600';

  return {
    type: 'box',
    layout: 'vertical',
    spacing: 'sm',
    contents: [
      {
        type: 'button',
        action: {
          type: 'uri',
          label: t`See reported message`,
          uri: articleUrl,
        },
        style: 'primary',
        color,
      },
      {
        type: 'button',
        action: {
          type: 'uri',
          label: isUpdating ? t`Rewrite my reason` : t`Provide more info`,
          uri: getLIFFURL('reason', userId, sessionId),
        },
        style: 'primary',
        color,
      },
    ],
  };
}

/**
 * @param {{ text: string, hyperlinks: {title: string, summary: string }[]}} highlight - highlight object
 * @param {string} oriText - Original text, used when highlightText null or undefined.
 * @param {string} lettersLimit - Default to be 200 (maxLine: 6 * 30). In en, one line is 30 letters most; In zh-tw, one line is 16 letters most.
 * @param {string} contentsLimit - Default to be 4000. Flex message carousel 50K limit. Flex message allows at most 10 bubbles so bubble contents should less than 5000 - 850(bubble without contents).
 * @returns {object[]} Flex text contents
 */
export function createHighlightContents(
  highlight,
  oriText = '',
  lettersLimit = 200,
  contentsLimit = 4000
) {
  let result = [];
  let totalLength = 4; // 4 comes from JSON.stringify([]).length;
  let totalLetters = 0;

  // return original text if highlight null or undefined, basically this won't happen
  if (!highlight) {
    return [
      {
        type: 'span',
        text: ellipsis(oriText, lettersLimit),
      },
    ];
  }

  const summaries = highlight.hyperlinks?.reduce((result, hyperlink) => {
    if (hyperlink.summary) result.push(hyperlink.summary);
    return result;
  }, []);
  const titles = highlight.hyperlinks?.reduce((result, hyperlink) => {
    if (hyperlink.title) result.push(hyperlink.title);
    return result;
  }, []);
  const text =
    highlight.text ||
    (summaries.length ? summaries.join('\n') : undefined) ||
    (titles.length ? titles.join('\n') : undefined);

  // fix issue 220 (api bug)
  // return original text if highlight isn't null but text and hyperlinks are null
  if (!text) {
    return [
      {
        type: 'span',
        text: ellipsis(oriText, lettersLimit),
      },
    ];
  }

  for (let highlightPair of text.split('</HIGHLIGHT>')) {
    const highlightContent = createHighlightContent(
      highlightPair.split('<HIGHLIGHT>')
    );
    totalLength +=
      highlightContent.defaultContentLength + highlightContent.lettersLength;
    totalLetters += highlightContent.lettersLength;
    if (totalLetters > lettersLimit || totalLength > contentsLimit) {
      result.push({
        type: 'span',
        text: '...',
      });
      break;
    }
    result.push(...highlightContent.content);
  }

  return result;
}

/**
 * @param {string[]} text - array[0] is normal text ,array[1] is highlight text, both may be null or undefined
 * @returns {{ defaultContentLength: number, lettersLength: number, content: string[] }} Flex text contents
 * */
function createHighlightContent(text) {
  let result = { defaultContentLength: 0, lettersLength: 0, content: [] };

  if (text[0]) {
    result.content.push({
      type: 'span',
      text: text[0],
    });

    // 34 comes from JSON.stringify({type: 'span',text: '',}).length
    result.defaultContentLength += 34;
    result.lettersLength += text[0].length;
  }

  if (text[1]) {
    result.content.push({
      type: 'span',
      text: text[1],
      color: '#ffb600',
      weight: 'bold',
    });

    // 76 comes from JSON.stringify({type: 'span',text: '',color: '#ffb600',weight: 'bold',}).length
    result.defaultContentLength += 76;
    result.lettersLength += text[1].length;
  }
  return result;
}

/**
 * @param {object} reply `Reply` type from rumors-api
 * @param {object} article `Article` type from rumors-api
 * @param {string} selectedArticleId
 * @returns {object[]} message object array
 */
export function createReplyMessages(reply, article, selectedArticleId) {
  const articleUrl = getArticleURL(selectedArticleId);
  const typeStr = createTypeWords(reply.type).toLocaleLowerCase();

  return [
    {
      type: 'text',
      text: `💡 ${t`Someone on the internet replies to the message:`}`,
    },
    ...commonReplyMessages(reply, typeStr, article.replyCount, articleUrl),
  ];
}

/**
 * @param {object} reply `Reply` type from rumors-api
 * @param {object} article `Article` type from rumors-api
 * @param {string} selectedArticleId
 * @returns {object[]} message object array
 */
export function createGroupReplyMessages(
  input,
  reply,
  articleReplyCount,
  selectedArticleId
) {
  const articleUrl = getArticleURL(selectedArticleId);
  const typeStr = createTypeWords(reply.type).toLocaleLowerCase();
  // same as initState.js
  const inputSummary = ellipsis(input, 12);
  return [
    {
      type: 'text',
      text: `${t`Thank you for sharing “${inputSummary}”`}😊 \n${t`I found that there are some disagreement to the message:`}`,
    },
    ...commonReplyMessages(reply, typeStr, articleReplyCount, articleUrl),
  ];
}

function commonReplyMessages(reply, typeStr, articleReplyCount, articleUrl) {
  return [
    {
      type: 'text',
      text: ellipsis(reply.text, 2000),
    },
    {
      type: 'text',
      text: ellipsis(createReferenceWords(reply), 2000),
    },
    {
      type: 'text',
      text:
        `⬆️ ${t`Therefore, the author think the message ${typeStr}.`}\n\n` +
        `💁 ${t`This content is provided by Cofact message reporting chatbot and crowd-sourced fact-checking community under CC BY-SA 4.0 license. Please refer to their references and make judgements on your own.`}\n\n` +
        (articleReplyCount > 1
          ? `🗣️ ${t`There are different replies for the message. Read them all here before making judgements:`}\n${articleUrl}\n`
          : '') +
        `\n⁉️ ${t`If you have different thoughts, you may have your say here:`}\n${articleUrl}`,
    },
  ];
}

/**
 * @param {string} timestamp Line message event timestamp
 * @returns {boolean}
 */
export function isEventExpired(timestamp, milliseconds = 30 * 1000) {
  var timeElapsed = Date.now() - new Date(timestamp).getTime();
  // console.log('timeElapsed' + timeElapsed);
  return timeElapsed > milliseconds;
}

export const POSTBACK_NO_ARTICLE_FOUND = '__NO_ARTICLE_FOUND__';

/**
 * @param {string} articleId
 * @returns {object} Flex bubble messasge object that opens a Comment LIFF
 */
export function createCommentBubble(articleId) {
  return {
    type: 'bubble',
    header: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: t`Provide more detail`,
          size: 'lg',
          color: '#00B172',
        },
      ],
      paddingBottom: 'none',
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: t`It would help fact checkers a lot if you provide more detail :)`,
          wrap: true,
        },
      ],
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          action: {
            type: 'uri',
            label: t`Provide detail`,
            uri: `${process.env.LIFF_URL}?p=comment&articleId=${articleId}`,
          },
          style: 'primary',
          color: '#00B172',
        },
      ],
      spacing: 'sm',
    },
  };
}

/**
 * Creates a single flex bubble message that acts identical to text message, but cannot be copied
 * nor forwarded by the user.
 *
 * This prevents user to "share" Cofacts chatbot's text to Cofacts chatbot itself.
 *
 * @param {Object} textProps - https://developers.line.biz/en/reference/messaging-api/#f-text.
 *   type & wrap is specified by default.
 * @returns {Object} A single flex bubble message
 */
export function createTextMessage(textProps) {
  return {
    type: 'flex',
    altText: textProps.text,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            wrap: true,
            ...textProps,
          },
        ],
      },
    },
  };
}
