import type {
  Action,
  Message,
  FlexSpan,
  FlexBubble,
  EventBase,
  TextMessage,
  FlexMessage,
} from '@line/bot-sdk';
import { t, msgid, ngettext } from 'ttag';
import GraphemeSplitter from 'grapheme-splitter';
import gql from 'src/lib/gql';

import type {
  CreateHighlightContentsHighlightFragment,
  CreateReplyMessagesReplyFragment,
  CreateReplyMessagesArticleFragment,
  CreateReferenceWordsReplyFragment,
} from 'typegen/graphql';
import { getArticleURL, createTypeWords } from 'src/lib/sharedUtils';
import { sign } from 'src/lib/jwt';

const splitter = new GraphemeSplitter();

/**
 * @param label - Postback action button text, max 20 words
 * @param input - Input when pressed
 * @param displayText - Text to display in chat window.
 * @param sessionId - Current session ID
 * @param state - the state that processes the postback
 */
export function createPostbackAction(
  label: string,
  input: string,
  displayText: string,
  sessionId: number,
  state: string
): Action {
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
 * @param positive - Count of positive feedbacks
 * @param negative - Count of negative feedbacks
 * @return  Description of feedback counts
 */
export function createFeedbackWords(positive: number, negative: number) {
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
 * @returns The reference message to send
 */
export function createReferenceWords({
  reference,
  type,
}: CreateReferenceWordsReplyFragment) {
  const prompt = type === 'OPINIONATED' ? t`different opinions` : t`references`;

  if (reference) return `${prompt}：${reference}`;
  return `\uDBC0\uDC85 ⚠️️ ${t`This reply has no ${prompt} and it may be biased`} ⚠️️  \uDBC0\uDC85`;
}

/**
 * @param sessionId - Search session ID
 * @returns reply message object
 */
export function createAskArticleSubmissionConsentReply(
  sessionId: number
): Message {
  const btnText = `🆕 ${t`Report to database`}`;
  const spans: FlexSpan[] = [
    {
      type: 'span',
      text: t`Currently we don’t have this message in our database. If you think it is most likely a rumor, `,
    },
    {
      type: 'span',
      text: t`press “${btnText}” to make this message public on Cofacts database `,
      color: '#ffb600',
      weight: 'bold',
    },
    {
      type: 'span',
      text: t`and have volunteers fact-check it. This way you can help the people who receive the same message in the future.`,
    },
  ];

  return {
    type: 'flex',
    altText: t`Be the first to report the message`,
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
            contents: spans,
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
            action: createPostbackAction(
              btnText,
              POSTBACK_YES,
              btnText,
              sessionId,
              'ASKING_ARTICLE_SUBMISSION_CONSENT'
            ),
          },
          {
            type: 'button',
            style: 'primary',
            color: '#333333',
            action: createPostbackAction(
              t`Don’t report`,
              POSTBACK_NO,
              t`Don’t report`,
              sessionId,
              'ASKING_ARTICLE_SUBMISSION_CONSENT'
            ),
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
 * @return if the text length is lower than limit, return text; else, return
 *         text with ellipsis.
 */
export function ellipsis(text: string, limit: number, ellipsis = '⋯⋯') {
  if (splitter.countGraphemes(text) < limit) return text;

  return (
    splitter
      .splitGraphemes(text)
      .slice(0, limit - ellipsis.length)
      .join('') + ellipsis
  );
}

/**
 * @returns Reply object with sharing buttings
 */
export function createArticleShareBubble(articleUrl: string): FlexBubble {
  return {
    type: 'bubble',
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          wrap: true,
          text: t`We all get by with a little help from our friends 🌟 Share your question to friends, someone might be able to help!`,
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
export function createNotificationSettingsBubble(): FlexBubble {
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
          text: t`You can turn on notifications if you want Cofacts to notify you when someone replies to this message.`,
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
            uri: `${process.env.LIFF_URL}?p=setting&utm_source=rumors-line-bot&utm_medium=reply-request`,
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
   * @param instruction - A message telling user why the manipulation is wrong and what they
   *                      should do instead.
   */
  constructor(instruction: string) {
    super(instruction);
  }
}

/**
 * Exception for processsing requests timeout
 */
export class TimeoutError extends Error {
  /**
   * @param instruction
   */
  constructor(instruction: string) {
    super(instruction);
  }
}

export const MANUAL_FACT_CHECKERS = [
  {
    label: 'MyGoPen 真人查證',
    value: 'https://line.me/R/ti/p/%40imygopen',
  },
];

/**
 * @returns {object} Reply object with buttons that goes to other fact checkers
 */
export function createSuggestOtherFactCheckerReply(): Message {
  const suggestion = t`We suggest forwarding the message to the following fact-checkers instead. They have 💁 1-on-1 Q&A service to respond to your questions.`;
  return {
    type: 'flex',
    altText: suggestion,
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
 * @param highlight - highlight object
 * @param oriText - Original text, used when highlightText null or undefined.
 * @param lettersLimit - Default to be 200 (maxLine: 6 * 30). In en, one line is 30 letters most; In zh-tw, one line is 16 letters most.
 * @param contentsLimit - Default to be 4000. Flex message carousel 50K limit. Flex message allows at most 10 bubbles so bubble contents should less than 5000 - 850(bubble without contents).
 * @returns Flex text contents
 */
export function createHighlightContents(
  highlight: CreateHighlightContentsHighlightFragment | null | undefined,
  oriText = '',
  lettersLimit = 200,
  contentsLimit = 4000
): FlexSpan[] {
  const result: FlexSpan[] = [];
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

  const summaries = highlight.hyperlinks?.reduce<string[]>(
    (result, hyperlink) => {
      if (hyperlink?.summary) result.push(hyperlink.summary);
      return result;
    },
    []
  );
  const titles = highlight.hyperlinks?.reduce<string[]>((result, hyperlink) => {
    if (hyperlink?.title) result.push(hyperlink.title);
    return result;
  }, []);
  const text =
    highlight.text ||
    (summaries?.length ? summaries.join('\n') : undefined) ||
    (titles?.length ? titles.join('\n') : undefined);

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

  for (const highlightPair of text.split('</HIGHLIGHT>')) {
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
 * @param text - array[0] is normal text ,array[1] is highlight text, both may be null or undefined
 * @returns Flex text contents
 * */
function createHighlightContent(text: ReadonlyArray<string>) {
  const result = {
    defaultContentLength: 0,
    lettersLength: 0,
    content: [] as FlexSpan[],
  };

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
 * @param reply `Reply` type from rumors-api
 * @param article `Article` type from rumors-api
 * @param selectedArticleId
 * @returns message object array
 */
export function createReplyMessages(
  reply: CreateReplyMessagesReplyFragment,
  article: CreateReplyMessagesArticleFragment,
  selectedArticleId: string
): Message[] {
  const articleUrl = getArticleURL(selectedArticleId);
  const typeStr = createTypeWords(reply.type).toLocaleLowerCase();

  return [
    {
      type: 'text',
      text: `💡 ${t`Someone on the internet replies to the message:`}`,
    },
    ...commonReplyMessages(reply, typeStr, article.replyCount ?? 0, articleUrl),
  ];
}

const AI_REPLY_IMAGE_VERSION = '20230405';

/**
 *
 * @param articleId
 * @param userId
 * @returns AI reply object, or null of AI cannot return reply.
 */
export async function createAIReply(articleId: string, userId: string) {
  const text = (
    await gql`
      mutation ($articleId: String!) {
        CreateAIReply(articleId: $articleId) {
          text
        }
      }
    `({ articleId }, { userId })
  ).data.CreateAIReply?.text;

  return !text
    ? null
    : {
        type: 'text',
        text,
        sender: {
          name: 'AI 自動分析',
          iconUrl: `${process.env.RUMORS_LINE_BOT_URL}/static/img/aireply.png?cachebust=${AI_REPLY_IMAGE_VERSION}`,
        },
      };
}

/**
 * @param {object} reply `Reply` type from rumors-api
 * @param {object} article `Article` type from rumors-api
 * @param {string} selectedArticleId
 * @returns {object[]} message object array
 */
export function createGroupReplyMessages(
  input: string,
  reply: CreateReplyMessagesReplyFragment,
  articleReplyCount: number,
  selectedArticleId: string
): Message[] {
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

function commonReplyMessages(
  reply: CreateReplyMessagesReplyFragment,
  typeStr: string,
  articleReplyCount: number,
  articleUrl: string
): Message[] {
  return [
    {
      type: 'text',
      text: ellipsis(reply.text ?? '', 2000),
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
 * @param timestamp Line message event timestamp
 */
export function isEventExpired(
  timestamp: EventBase['timestamp'],
  milliseconds = 30 * 1000
) {
  const timeElapsed = Date.now() - new Date(timestamp).getTime();
  // console.log('timeElapsed' + timeElapsed);
  return timeElapsed > milliseconds;
}

export const POSTBACK_NO_ARTICLE_FOUND = '__NO_ARTICLE_FOUND__';

/**
 * @param articleId
 * @returns Flex bubble messasge object that opens a Comment LIFF
 */
export function createCommentBubble(articleId: string): FlexBubble {
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
export function createTextMessage(
  textProps: Omit<TextMessage, 'type'>
): FlexMessage {
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

export const POSTBACK_YES = '__POSTBACK_YES__';
export const POSTBACK_NO = '__POSTBACK_NO__';

/**
 *
 * @param sessionId - Chatbot session ID
 * @returns {object} Messaging API message object
 */
export function createArticleSourceReply(sessionId: number): FlexMessage {
  const question = t`Did you forward this message as a whole to me from the LINE app?`;

  return {
    type: 'flex',
    altText: question,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: question,
            wrap: true,
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
            action: createPostbackAction(
              t`Yes, I forwarded it as a whole`,
              POSTBACK_YES,
              t`Yes, I forwarded it as a whole`,
              sessionId,
              'ASKING_ARTICLE_SOURCE'
            ),
            style: 'primary',
            color: '#333333',
          },
          {
            type: 'button',
            action: createPostbackAction(
              t`No, typed it myself`,
              POSTBACK_NO,
              t`No, typed it myself`,
              sessionId,
              'ASKING_ARTICLE_SOURCE'
            ),
            style: 'primary',
            color: '#333333',
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

const LINE_CONTENT_EXP_SEC = 300; // LINE content proxy JWT is only valid for 5 min

/**
 * @param messageId - The line messageId
 */
export function getLineContentProxyURL(messageId: string) {
  const jwt = sign({
    messageId,
    exp: Math.round(Date.now() / 1000) + LINE_CONTENT_EXP_SEC,
  });

  return `${process.env.RUMORS_LINE_BOT_URL}/getcontent?token=${jwt}`;
}
