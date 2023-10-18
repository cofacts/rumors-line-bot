jest.mock('src/lib/ga');
import ga from 'src/lib/ga';

import askingArticleSource from '../askingArticleSource';
import { POSTBACK_YES, POSTBACK_NO } from '../utils';

beforeEach(() => {
  ga.clearAllMocks();
});

it('throws on incorrect input', async () => {
  const incorrectParam = {
    data: { searchedText: 'foo' },
    state: 'ASKING_ARTICLE_SOURCE',
    event: {
      input: 'Wrong',
    },
  };

  expect(askingArticleSource(incorrectParam)).rejects.toMatchInlineSnapshot(
    `[Error: Please choose from provided options.]`
  );
});

it('returns instructions if user did not forward the whole message', async () => {
  const didNotForwardParam = {
    data: { searchedText: 'foo', sessionId: 'the-session-id' },
    state: 'ASKING_ARTICLE_SOURCE',
    event: {
      input: POSTBACK_NO,
    },
  };

  const { replies } = await askingArticleSource(didNotForwardParam);
  expect(replies).toMatchInlineSnapshot(`
    Array [
      Object {
        "altText": "Instructions",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "contents": Array [
                  Object {
                    "text": "I am a bot which only recognizes messages forwarded on LINE, therefore it is important to send me the",
                    "type": "span",
                  },
                  Object {
                    "color": "#ffb600",
                    "text": " entire message ",
                    "type": "span",
                    "weight": "bold",
                  },
                  Object {
                    "text": "that is being passed around so I can identify it.",
                    "type": "span",
                  },
                ],
                "type": "text",
                "wrap": true,
              },
            ],
            "layout": "vertical",
            "type": "box",
          },
          "type": "bubble",
        },
        "type": "flex",
      },
      Object {
        "altText": "You can try:",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "You can try:",
                "type": "text",
                "wrap": true,
              },
            ],
            "layout": "vertical",
            "type": "box",
          },
          "type": "bubble",
        },
        "type": "flex",
      },
      Object {
        "altText": "Provide more detail",
        "contents": Object {
          "contents": Array [
            Object {
              "body": Object {
                "contents": Array [
                  Object {
                    "text": "If you have access to the whole message on LINE, please use the “Share” function to share it with me.",
                    "type": "text",
                    "wrap": true,
                  },
                ],
                "layout": "vertical",
                "type": "box",
              },
              "footer": Object {
                "contents": Array [
                  Object {
                    "action": Object {
                      "data": "{\\"input\\":\\"📖 tutorial\\",\\"sessionId\\":\\"the-session-id\\",\\"state\\":\\"TUTORIAL\\"}",
                      "displayText": "📖 tutorial",
                      "label": "See Tutorial",
                      "type": "postback",
                    },
                    "color": "#00B172",
                    "style": "primary",
                    "type": "button",
                  },
                ],
                "layout": "vertical",
                "spacing": "sm",
                "type": "box",
              },
              "header": Object {
                "contents": Array [
                  Object {
                    "color": "#00B172",
                    "size": "lg",
                    "text": "Try again with the whole message",
                    "type": "text",
                    "wrap": true,
                  },
                ],
                "layout": "vertical",
                "paddingBottom": "none",
                "type": "box",
              },
              "type": "bubble",
            },
            Object {
              "body": Object {
                "contents": Array [
                  Object {
                    "text": "You can forward your question to another LINE account which provides a human response",
                    "type": "text",
                    "wrap": true,
                  },
                ],
                "layout": "vertical",
                "type": "box",
              },
              "footer": Object {
                "contents": Array [
                  Object {
                    "action": Object {
                      "label": "MyGoPen 真人查證",
                      "type": "uri",
                      "uri": "https://line.me/R/ti/p/%40imygopen",
                    },
                    "color": "#333333",
                    "style": "primary",
                    "type": "button",
                  },
                ],
                "layout": "vertical",
                "spacing": "sm",
                "type": "box",
              },
              "header": Object {
                "contents": Array [
                  Object {
                    "color": "#333333",
                    "size": "lg",
                    "text": "Find a real person",
                    "type": "text",
                    "wrap": true,
                  },
                ],
                "layout": "vertical",
                "paddingBottom": "none",
                "type": "box",
              },
              "type": "bubble",
            },
          ],
          "type": "carousel",
        },
        "type": "flex",
      },
    ]
  `);

  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "IsForwarded",
          "ec": "UserInput",
          "el": "No",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('sends user submission consent if user forwarded the whole message', async () => {
  const didForwardParam = {
    data: { searchedText: 'foo', sessionId: 'the-session-id' },
    state: 'ASKING_ARTICLE_SOURCE',
    event: {
      input: POSTBACK_YES,
    },
  };

  const { replies } = await askingArticleSource(didForwardParam);
  expect(replies).toMatchInlineSnapshot(`
    Array [
      Object {
        "altText": "I see. Don’t trust the message just yet!",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "I see. Don’t trust the message just yet!",
                "type": "text",
                "wrap": true,
              },
            ],
            "layout": "vertical",
            "type": "box",
          },
          "type": "bubble",
        },
        "type": "flex",
      },
      Object {
        "altText": "Do you want someone to fact-check this message?",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "Do you want someone to fact-check this message?",
                "type": "text",
                "wrap": true,
              },
            ],
            "layout": "vertical",
            "type": "box",
          },
          "type": "bubble",
        },
        "type": "flex",
      },
      Object {
        "altText": "Be the first to report the message",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "contents": Array [
                  Object {
                    "text": "Currently we don’t have this message in our database. If you think it is most likely a rumor, ",
                    "type": "span",
                  },
                  Object {
                    "color": "#ffb600",
                    "text": "press “🆕 Report to database” to make this message public on Cofacts database ",
                    "type": "span",
                    "weight": "bold",
                  },
                  Object {
                    "text": "and have volunteers fact-check it. This way you can help the people who receive the same message in the future.",
                    "type": "span",
                  },
                ],
                "type": "text",
                "wrap": true,
              },
            ],
            "layout": "vertical",
            "paddingAll": "lg",
            "spacing": "md",
            "type": "box",
          },
          "footer": Object {
            "contents": Array [
              Object {
                "action": Object {
                  "data": "{\\"input\\":\\"__POSTBACK_YES__\\",\\"sessionId\\":\\"the-session-id\\",\\"state\\":\\"ASKING_ARTICLE_SUBMISSION_CONSENT\\"}",
                  "displayText": "🆕 Report to database",
                  "label": "🆕 Report to database",
                  "type": "postback",
                },
                "color": "#ffb600",
                "style": "primary",
                "type": "button",
              },
              Object {
                "action": Object {
                  "data": "{\\"input\\":\\"__POSTBACK_NO__\\",\\"sessionId\\":\\"the-session-id\\",\\"state\\":\\"ASKING_ARTICLE_SUBMISSION_CONSENT\\"}",
                  "displayText": "Don’t report",
                  "label": "Don’t report",
                  "type": "postback",
                },
                "color": "#333333",
                "style": "primary",
                "type": "button",
              },
            ],
            "layout": "vertical",
            "spacing": "sm",
            "type": "box",
          },
          "styles": Object {
            "body": Object {
              "separator": true,
            },
          },
          "type": "bubble",
        },
        "type": "flex",
      },
    ]
  `);

  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "IsForwarded",
          "ec": "UserInput",
          "el": "Yes",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});
