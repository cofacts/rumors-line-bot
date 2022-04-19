import { t } from 'ttag';
import ga from 'src/lib/ga';

import {
  POSTBACK_IS_FORWARDED,
  POSTBACK_IS_NOT_FORWARDED,
  ManipulationError,
  createTextMessage,
  MANUAL_FACT_CHECKERS,
  createPostbackAction,
} from './utils';

import { TUTORIAL_STEPS } from './tutorial';

export default async function askingArticleSource(params) {
  let { data, state, event, userId, replies } = params;

  const visitor = ga(userId, state, data.searchedText);

  switch (event.input) {
    default:
      throw new ManipulationError(t`Please choose from provided options.`);

    case POSTBACK_IS_NOT_FORWARDED:
      replies = [
        createTextMessage({
          contents: [
            {
              type: 'span',
              text: /* t: ~ entire message that ... */ t`I am a bot which only recognizes messages forwarded on LINE, therefore it is important to send me the`,
            },
            {
              type: 'span',
              text: /* t: emphasized text in sentence "It is important to send me the ~ that is being passed around" */ t`entire message`,
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
                        '',
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
                      text: t` You can forward your question to another LINE account which provides a human response`,
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
      break;

    case POSTBACK_IS_FORWARDED:
  }

  visitor.send();

  return { data, event, userId, replies };
}
