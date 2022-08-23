jest.mock('src/lib/ga');

import tutorial, {
  TUTORIAL_STEPS,
  createGreetingMessage,
  createTutorialMessage,
} from '../tutorial';
import ga from 'src/lib/ga';

const param = {
  data: {
    sessionId: 1497994017447,
  },
  event: {
    type: 'text',
    input: undefined,
    timestamp: 1519019734813,
  },
  issuedAt: 1519019735467,
  userId: 'Uaddc74df8a3a176b901d9d648b0fc4fe',
  replies: undefined,
};

beforeEach(() => {
  param.event.input = undefined;
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

it('should handle RICH_MENU', () => {
  param.event.input = TUTORIAL_STEPS['RICH_MENU'];

  const result = tutorial(param);
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
  param.event.input = TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE'];

  const result = tutorial(param);
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
  param.event.input = TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP'];

  const result = tutorial(param);
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
  param.event.input =
    TUTORIAL_STEPS['EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP'];

  const result = tutorial(param);
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
  param.event.input =
    TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION'];

  const result = tutorial(param);
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
  param.event.input = TUTORIAL_STEPS['SETUP_DONE'];

  const result = tutorial(param);
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
  param.event.input = TUTORIAL_STEPS['SETUP_LATER'];

  const result = tutorial(param);
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
