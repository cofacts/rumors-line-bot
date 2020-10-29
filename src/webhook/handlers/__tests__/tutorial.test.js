import tutorial, {
  TUTORIAL_STEPS,
  createGreetingMessage,
  createTutorialMessage,
} from '../tutorial';

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
});

it('rejects undefined input', () => {
  expect(tutorial(param)).rejects.toMatchInlineSnapshot(
    `[Error: input undefined]`
  );
});

it('should handle RICH_MENU_TRIGGER', async () => {
  param.event.input = TUTORIAL_STEPS['RICH_MENU_TRIGGER'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('should handle SIMULATE_FORWARDING_MESSAGE', async () => {
  param.event.input = TUTORIAL_STEPS['SIMULATE_FORWARDING_MESSAGE'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('should handle PROVIDE_PERMISSION_SETUP', async () => {
  param.event.input = TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('should handle EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP', async () => {
  param.event.input =
    TUTORIAL_STEPS['EXPLAN_CHATBOT_FLOW_AND_PROVIDE_PERMISSION_SETUP'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('should handle PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION', async () => {
  param.event.input =
    TUTORIAL_STEPS['PROVIDE_PERMISSION_SETUP_WITH_EXPLANATION'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('should handle SETUP_DONE', async () => {
  param.event.input = TUTORIAL_STEPS['SETUP_DONE'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('should handle SETUP_LATER', async () => {
  param.event.input = TUTORIAL_STEPS['SETUP_LATER'];

  const result = await tutorial(param);
  expect(result).toMatchSnapshot();
});

it('createGreetingMessage()', async () => {
  const result = createGreetingMessage();
  expect(result).toMatchSnapshot();
});

it('createTutorialMessage()', async () => {
  const result = createTutorialMessage(param.data.sessionId);
  expect(result).toMatchSnapshot();
});
