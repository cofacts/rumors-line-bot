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
  isSkipUser: false,
};

beforeEach(() => {
  param.event.input = undefined;
  ga.clearAllMocks();
});

it('rejects undefined input', () => {
  expect(tutorial(param)).rejects.toMatchInlineSnapshot(
    `[Error: input undefined]`
  );
});

it('should handle RICH_MENU', async () => {
  param.event.input = TUTORIAL_STEPS['RICH_MENU'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "RICH_MENU_TRIGGER",
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle SIMULATE_FORWARDING_MESSAGE', async () => {
  param.event.input = TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "SIMULATE_FORWARDING_MESSAGE",
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle PROVIDE_PERMISSION_SETUP', async () => {
  param.event.input = TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "PROVIDE_PERMISSION_SETUP",
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP', async () => {
  param.event.input =
    TUTORIAL_STEPS['EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP",
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION', async () => {
  param.event.input =
    TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION",
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle SETUP_DONE', async () => {
  param.event.input = TUTORIAL_STEPS['SETUP_DONE'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "SETUP_DONE",
      ],
    ]
  `);
  expect(ga.sendMock).toHaveBeenCalledTimes(1);
});

it('should handle SETUP_LATER', async () => {
  param.event.input = TUTORIAL_STEPS['SETUP_LATER'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
  expect(ga.mock.calls).toMatchInlineSnapshot(`
    Array [
      Array [
        "Uaddc74df8a3a176b901d9d648b0fc4fe",
        "TUTORIAL",
        "SETUP_LATER",
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
