jest.mock('src/lib/ga');

import tutorial, {
  TUTORIAL_STEPS,
  createGreetingMessage,
  createTutorialMessage,
} from '../tutorial';
import originalGa from 'src/lib/ga';
import type { MockedGa } from 'src/lib/__mocks__/ga';
import { ChatbotPostbackHandlerParams } from 'src/types/chatbotState';

const ga = originalGa as MockedGa;

const param: ChatbotPostbackHandlerParams = {
  data: {
    sessionId: 1497994017447,
    searchedText: '',
  },
  postbackData: {
    sessionId: 1497994017447,
    state: 'TUTORIAL',
    input: undefined,
  },
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
};

beforeEach(() => {
  ga.clearAllMocks();
  process.env.RUMORS_LINE_BOT_URL = 'https://testlinebot.cofacts';
});

afterEach(() => {
  delete process.env.RUMORS_LINE_BOT_URL;
});

it('rejects RUMORS_LINE_BOT_URL undefined', () => {
  delete process.env.RUMORS_LINE_BOT_URL;
  expect(() => tutorial(param)).toThrowError('RUMORS_LINE_BOT_URL undefined');
});

it('rejects undefined input', () => {
  expect(() => tutorial(param)).toThrowError('input undefined');
});

function getParamWithInput(input: unknown) {
  return {
    ...param,
    postbackData: { ...param.postbackData, input },
  };
}

it('should handle RICH_MENU', () => {
  const result = tutorial(getParamWithInput(TUTORIAL_STEPS['RICH_MENU']));
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "RICH_MENU",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle SIMULATE_FORWARDING_MESSAGE', () => {
  const result = tutorial(
    getParamWithInput(TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE'])
  );
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "SIMULATE_FORWARDING_MESSAGE",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle PROVIDE_PERMISSION_SETUP', () => {
  const result = tutorial(
    getParamWithInput(TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP'])
  );
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "PROVIDE_PERMISSION_SETUP",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP', () => {
  const result = tutorial(
    getParamWithInput(
      TUTORIAL_STEPS['EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP']
    )
  );
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION', () => {
  const result = tutorial(
    getParamWithInput(
      TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION']
    )
  );
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle SETUP_DONE', () => {
  const result = tutorial(getParamWithInput(TUTORIAL_STEPS['SETUP_DONE']));
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "SETUP_DONE",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle SETUP_LATER', () => {
  const result = tutorial(getParamWithInput(TUTORIAL_STEPS['SETUP_LATER']));
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
      ],
    ]
  `);
  expect(ga.eventMock.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        Object {
          "ea": "Step",
          "ec": "Tutorial",
          "el": "SETUP_LATER",
        },
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('createGreetingMessage()', () => {
  const result = createGreetingMessage();
  expect(result).toMatchSnapshot();
});

it('createTutorialMessage()', () => {
  const result = createTutorialMessage(param.data.sessionId);
  expect(result).toMatchSnapshot();
});
