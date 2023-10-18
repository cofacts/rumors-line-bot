import { t } from 'ttag';
import ga from 'src/lib/ga';

import {
  POSTBACK_YES,
  POSTBACK_NO,
  ManipulationError,
  createTextMessage,
  MANUAL_FACT_CHECKERS,
  createPostbackAction,
  createAskArticleSubmissionConsentReply,
} from './utils';

import { TUTORIAL_STEPS } from './tutorial';
import { ChatbotStateHandler } from 'src/types/chatbotState';

const askingArticleSource: ChatbotStateHandler = async (params) => {
  const { data, state, event, userId } = params;
  let { replies } = params;

  const visitor = ga(userId, state, data.searchedText);

  switch (event.input) {
    default:
      throw new ManipulationError(t`Please choose from provided options.`);

    case POSTBACK_NO:
      replies = [
        createTextMessage({
          altText: t`Instructions`,
          contents: [
            {
              type: 'span',
              text: /* t: ~ entire message that ... */ t`I am a bot which only recognizes messages forwarded on LINE, therefore it is important to send me the`,
            },
            {
              type: 'span',
              text: /* t: emphasized text in sentence "It is important to send me the ~ that is being passed around" */ t` entire message `,
              color: '#ffb600',
              weight: 'bold',
            },
            {
              type: 'span',
              text: /* t: the entire message ~ */ t`that is being passed around so I can identify it.`,
            },
          ],
        }),
        createTextMessage({ text: t`You can try:` }),
        {
          type: 'flex',
          altText: t`Provide more detail`,
          contents: {
            type: 'carousel',
            contents: [
              {
                type: 'bubble',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: t`Try again with the whole message`,
                      wrap: true,
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
                      text: t`If you have access to the whole message on LINE, please use the “Share” function to share it with me.`,
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
                      action: createPostbackAction(
                        t`See Tutorial`,
                        TUTORIAL_STEPS.RICH_MENU,
                        TUTORIAL_STEPS.RICH_MENU,
                        data.sessionId,
                        'TUTORIAL'
                      ),
                      style: 'primary',
                      color: '#00B172',
                    },
                  ],
                  spacing: 'sm',
                },
              },
              {
                type: 'bubble',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: t`Find a real person`,
                      wrap: true,
                      size: 'lg',
                      color: '#333333',
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
                      text: t`You can forward your question to another LINE account which provides a human response`,
                      wrap: true,
                    },
                  ],
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
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
                  spacing: 'sm',
                },
              },
            ],
          },
        },
      ];
      visitor.event({
        ec: 'UserInput',
        ea: 'IsForwarded',
        el: 'No',
      });
      break;

    case POSTBACK_YES:
      replies = [
        createTextMessage({
          text: t`I see. Don’t trust the message just yet!`,
        }),
        createTextMessage({
          text: t`Do you want someone to fact-check this message?`,
        }),
        createAskArticleSubmissionConsentReply(data.sessionId),
      ];
      visitor.event({
        ec: 'UserInput',
        ea: 'IsForwarded',
        el: 'Yes',
      });
  }

  visitor.send();

  return { data, event, userId, replies };
};

export default askingArticleSource;
