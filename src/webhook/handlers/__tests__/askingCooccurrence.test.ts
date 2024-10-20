jest.mock('src/lib/ga');
jest.mock('src/lib/gql');
import type { MockedGa } from 'src/lib/__mocks__/ga';
import type { MockedGql } from 'src/lib/__mocks__/gql';

import askingCooccurrence, { Input } from '../askingCooccurrence';
import originalGql from 'src/lib/gql';
import originalGa from 'src/lib/ga';
import { ChatbotPostbackHandlerParams } from 'src/types/chatbotState';
import { POSTBACK_NO, POSTBACK_YES } from '../utils';
import {
  AddReplyRequestForUnrepliedArticleMutation,
  ListArticlesInInitStateQuery,
  ListArticlesInProcessMediaQuery,
  SetCooccurrencesMutation,
} from 'typegen/graphql';
import { imageMessage, textMessage } from '../__fixtures__/askingCooccurrence';

const ga = originalGa as MockedGa;
const gql = originalGql as MockedGql;

beforeEach(() => {
  ga.clearAllMocks();
});

it('throws on incorrect input', async () => {
  const incorrectParam: ChatbotPostbackHandlerParams = {
    context: { sessionId: 0, msgs: [] },
    postbackData: {
      sessionId: 0,
      state: 'ASKING_COOCCURRENCE',
      input: 'Wrong',
    },
    userId: 'the-user-id',
  };

  expect(askingCooccurrence(incorrectParam)).rejects.toMatchInlineSnapshot(
    `[Error: Please choose from provided options.]`
  );
});

it('tells user to send messages separately', async () => {
  const inputSession = new Date('2020-01-01T18:10:18.314Z').getTime();
  const params: ChatbotPostbackHandlerParams<Input> = {
    context: {
      sessionId: inputSession,
      msgs: [
        { id: 'foo', type: 'text', text: 'Some text forwarded by the user' },
      ],
    },
    postbackData: {
      sessionId: inputSession,
      state: 'ASKING_COOCCURRENCE',
      input: POSTBACK_NO,
    },
    userId: 'userId',
  };

  const { replies } = await askingCooccurrence(params);
  expect(replies).toMatchInlineSnapshot(`
    Array [
      Object {
        "altText": "Please send me the messages separately.",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "Please send me the messages separately.",
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
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "IsCooccurrence",
          "ec": "UserInput",
          "el": "No",
        },
      ],
    ]
  `);
});

it('stores cooccurrences whose article are all in DB', async () => {
  const params: ChatbotPostbackHandlerParams<Input> = {
    context: {
      sessionId: 0,
      msgs: [
        // Triggers searchText
        { type: 'text', text: textMessage.text, id: 'txt-message' },
        // Triggers searchMedia
        {
          type: 'image',
          id: 'img-message',
        },
      ],
    },
    postbackData: {
      sessionId: 0,
      state: 'ASKING_COOCCURRENCE',
      input: POSTBACK_YES,
    },
    userId: 'userId',
  };

  // Prepare gql mock by the order of the queries/mutations
  //
  [
    // searchText
    {
      ListArticles: {
        edges: [{ node: textMessage, highlight: null }],
      },
    } satisfies ListArticlesInInitStateQuery,

    // searchMedia
    {
      ListArticles: {
        edges: [
          {
            // Simulate the case when other similar result gets higher TF-IDF score
            node: textMessage,
            score: 3,
            mediaSimilarity: 0,
            highlight: null,
          },
          { node: imageMessage, score: 2, mediaSimilarity: 1, highlight: null },
        ],
      },
    } satisfies ListArticlesInProcessMediaQuery,

    // setMostSimilarArticlesAsCooccurrence
    {
      CreateOrUpdateCooccurrence: { id: 'some-id' },
    } satisfies SetCooccurrencesMutation,

    // addReplyRequestForUnrepliedCooccurredArticles
    {
      CreateOrUpdateReplyRequest: { id: 'some-id-1' },
    } satisfies AddReplyRequestForUnrepliedArticleMutation,

    {
      CreateOrUpdateReplyRequest: { id: 'some-id-2' },
    } satisfies AddReplyRequestForUnrepliedArticleMutation,
  ].forEach((resp) => gql.__push({ data: resp }));

  const { replies } = await askingCooccurrence(params);
  expect(gql.__finished()).toBe(true);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "IsCooccurrence",
          "ec": "UserInput",
          "el": "Yes",
        },
      ],
    ]
  `);

  // Should list both messages in occurrences
  //
  expect(replies).toMatchInlineSnapshot(`
    Array [
      Object {
        "altText": "🔍 There are some messages that looks similar to the ones you have sent to me.",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "🔍 There are some messages that looks similar to the ones you have sent to me.",
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
        "altText": "Internet rumors are often mutated and shared.
    Please choose the version that looks the most similar👇",
        "contents": Object {
          "body": Object {
            "contents": Array [
              Object {
                "text": "Internet rumors are often mutated and shared.
    Please choose the version that looks the most similar👇",
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
        "altText": "Please choose the most similar message from the list.",
        "contents": Object {
          "contents": Array [
            Object {
              "body": undefined,
              "direction": "ltr",
              "footer": Object {
                "contents": Array [
                  Object {
                    "action": Object {
                      "data": "{\\"input\\":\\"text-message\\",\\"sessionId\\":0,\\"state\\":\\"CHOOSING_ARTICLE\\"}",
                      "displayText": "I choose ①",
                      "label": "Choose this one",
                      "type": "postback",
                    },
                    "color": "#ffb600",
                    "style": "primary",
                    "type": "button",
                  },
                ],
                "layout": "horizontal",
                "type": "box",
              },
              "header": Object {
                "contents": Array [
                  Object {
                    "color": "#AAAAAA",
                    "gravity": "center",
                    "size": "sm",
                    "text": "① Looks 100% similar",
                    "type": "text",
                    "weight": "bold",
                    "wrap": true,
                  },
                ],
                "layout": "horizontal",
                "paddingBottom": "md",
                "spacing": "sm",
                "type": "box",
              },
              "hero": undefined,
              "type": "bubble",
            },
            Object {
              "body": undefined,
              "direction": "ltr",
              "footer": Object {
                "contents": Array [
                  Object {
                    "action": Object {
                      "data": "{\\"input\\":\\"img-message\\",\\"sessionId\\":0,\\"state\\":\\"CHOOSING_ARTICLE\\"}",
                      "displayText": "I choose ②",
                      "label": "Choose this one",
                      "type": "postback",
                    },
                    "color": "#ffb600",
                    "style": "primary",
                    "type": "button",
                  },
                ],
                "layout": "horizontal",
                "type": "box",
              },
              "header": Object {
                "contents": Array [
                  Object {
                    "color": "#AAAAAA",
                    "gravity": "center",
                    "size": "sm",
                    "text": "② Looks 100% similar",
                    "type": "text",
                    "weight": "bold",
                    "wrap": true,
                  },
                ],
                "layout": "horizontal",
                "paddingBottom": "md",
                "spacing": "sm",
                "type": "box",
              },
              "hero": Object {
                "size": "full",
                "type": "image",
                "url": "https://example.com/image.jpg",
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
});
