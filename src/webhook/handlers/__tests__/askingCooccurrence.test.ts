jest.mock('src/lib/ga');
jest.mock('src/lib/gql');
import type { MockedGa } from 'src/lib/__mocks__/ga';
import type { MockedGql } from 'src/lib/__mocks__/gql';

import askingCooccurrence, { Input } from '../askingCooccurrence';
import originalGql from 'src/lib/gql';
import originalGa from 'src/lib/ga';
import { ChatbotPostbackHandlerParams } from 'src/types/chatbotState';
import { POSTBACK_NO } from '../utils';

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

// it('stores cooccurrences and reply requests as expected', async () => {
// });
