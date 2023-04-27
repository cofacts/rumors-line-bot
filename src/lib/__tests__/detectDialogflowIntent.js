const mockSessionPath = jest.fn();
const mockDetectIntent = jest.fn();
const mockGetProjectId = jest.fn();

let detectDialogflowIntent;
const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  mockSessionPath.mockClear();
  mockDetectIntent.mockClear();
  mockGetProjectId.mockClear();

  // To test different case in `detectDialogflowIntent` we should resetModules
  //
  jest.resetModules();
  jest.mock('@google-cloud/dialogflow', () => ({
    SessionsClient: jest.fn().mockImplementation(() => ({
      projectAgentEnvironmentUserSessionPath: mockSessionPath,
      detectIntent: mockDetectIntent,
      getProjectId: mockGetProjectId,
    })),
  }));
});

const intentResponse = [
  {
    responseId: 'response_Id',
    queryResult: {
      fulfillmentMessages: [
        {
          platform: 'PLATFORM_UNSPECIFIED',
          text: { text: ['Hey！'] },
          message: 'text',
        },
      ],
      outputContexts: [],
      queryText: 'Hi',
      speechRecognitionConfidence: 0,
      action: 'input.welcome',
      parameters: { fields: {} },
      allRequiredParamsPresent: true,
      fulfillmentText: 'Hey！',
      webhookSource: '',
      webhookPayload: null,
      intent: {
        inputContextNames: [],
        events: [],
        trainingPhrases: [],
        outputContexts: [],
        parameters: [],
        messages: [],
        defaultResponsePlatforms: [],
        followupIntentInfo: [],
        name: 'projects/project_id/agent/intents/intent_id',
        displayName: 'Default Welcome Intent',
        priority: 0,
        isFallback: false,
        webhookState: 'WEBHOOK_STATE_UNSPECIFIED',
        action: '',
        resetContexts: false,
        rootFollowupIntentName: '',
        parentFollowupIntentName: '',
        mlDisabled: false,
      },
      intentDetectionConfidence: 1,
      diagnosticInfo: null,
      languageCode: 'zh-tw',
      sentimentAnalysisResult: null,
    },
    webhookStatus: null,
    outputAudio: { type: 'Buffer', data: [] },
    outputAudioConfig: null,
  },
];

it('skip detecting intent', async () => {
  mockGetProjectId.mockImplementation(() =>
    Promise.reject('Test the case when Google service account is not provided')
  );
  detectDialogflowIntent = require('../detectDialogflowIntent').default;
  await sleep(1); // Wait for module initialization (project ID detection)

  mockDetectIntent.mockImplementation(() => intentResponse);
  expect(await detectDialogflowIntent('Hi')).toMatchInlineSnapshot(`undefined`);
  expect(mockSessionPath).not.toHaveBeenCalled();
  expect(mockDetectIntent).not.toHaveBeenCalled();
});

it('detects intent', async () => {
  mockGetProjectId.mockImplementation(() => Promise.resolve('test-gcp-id'));
  detectDialogflowIntent = require('../detectDialogflowIntent').default;
  await sleep(1); // Wait for module initialization (project ID detection)

  mockDetectIntent.mockImplementation(() => intentResponse);
  expect(await detectDialogflowIntent('Hi')).toMatchInlineSnapshot(`
    Object {
      "outputAudio": Object {
        "data": Array [],
        "type": "Buffer",
      },
      "outputAudioConfig": null,
      "queryResult": Object {
        "action": "input.welcome",
        "allRequiredParamsPresent": true,
        "diagnosticInfo": null,
        "fulfillmentMessages": Array [
          Object {
            "message": "text",
            "platform": "PLATFORM_UNSPECIFIED",
            "text": Object {
              "text": Array [
                "Hey！",
              ],
            },
          },
        ],
        "fulfillmentText": "Hey！",
        "intent": Object {
          "action": "",
          "defaultResponsePlatforms": Array [],
          "displayName": "Default Welcome Intent",
          "events": Array [],
          "followupIntentInfo": Array [],
          "inputContextNames": Array [],
          "isFallback": false,
          "messages": Array [],
          "mlDisabled": false,
          "name": "projects/project_id/agent/intents/intent_id",
          "outputContexts": Array [],
          "parameters": Array [],
          "parentFollowupIntentName": "",
          "priority": 0,
          "resetContexts": false,
          "rootFollowupIntentName": "",
          "trainingPhrases": Array [],
          "webhookState": "WEBHOOK_STATE_UNSPECIFIED",
        },
        "intentDetectionConfidence": 1,
        "languageCode": "zh-tw",
        "outputContexts": Array [],
        "parameters": Object {
          "fields": Object {},
        },
        "queryText": "Hi",
        "sentimentAnalysisResult": null,
        "speechRecognitionConfidence": 0,
        "webhookPayload": null,
        "webhookSource": "",
      },
      "responseId": "response_Id",
      "webhookStatus": null,
    }
  `);
  expect(mockSessionPath).toHaveBeenCalledTimes(1);
  expect(mockDetectIntent).toHaveBeenCalledTimes(1);
});

it('handles error', async () => {
  mockGetProjectId.mockImplementation(() => Promise.resolve('test-gcp-id'));
  detectDialogflowIntent = require('../detectDialogflowIntent').default;
  await sleep(1); // Wait for module initialization (project ID detection)

  mockDetectIntent.mockImplementation(() => {
    const error = new Error(
      `3 INVALID_ARGUMENT: Resource name 'projects/undefined_project_id/agent/sessions/sessionId/' does not match 'projects/*/locations/*/agent/environments/*/users/*/sessions/*'.`
    );
    throw error;
  });
  expect(await detectDialogflowIntent('Hi')).toMatchInlineSnapshot(`undefined`);
  expect(mockSessionPath).toHaveBeenCalledTimes(1);
  expect(mockDetectIntent).toHaveBeenCalledTimes(1);
});
