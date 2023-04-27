// quotas limit https://cloud.google.com/dialogflow/quotas#es-agent_1
import dialogflow from '@google-cloud/dialogflow';
import crypto from 'crypto';

// https://googleapis.dev/nodejs/dialogflow/latest/v2beta1.SessionsClient.html
const sessionClient = new dialogflow.SessionsClient(/* { credentials } */);
let projectId = null;
sessionClient
  .getProjectId()
  .then((id) => {
    if (!id) return;

    projectId = id;
    console.log(`[Dialogflow] Connected to project ID = ${id}`);
  })
  .catch((e) => console.error('[Dialogflow]', e));

export default async function (input) {
  if (!projectId) {
    return;
  }
  // https://cloud.google.com/dialogflow/es/docs/api-overview#sessions
  const sessionId = crypto.randomBytes(16).toString('hex');
  try {
    // The path to identify the agent that owns the created intent.
    // https://cloud.google.com/dialogflow/es/docs/agents-versions#test_your_agent_in_an_environment
    //
    // Note: Not sure what's `user` parameter for, set it '-' which is the same as example in docs.
    // Discussions : https://stackoverflow.com/questions/55122875/how-to-use-dialogflow-environments-beta-feature-in-nodejs-dialogflow
    //
    const sessionPath = sessionClient.projectAgentEnvironmentUserSessionPath(
      projectId,
      process.env.DAILOGFLOW_ENV || 'draft',
      '-',
      sessionId
    );

    // The text query request.
    // Note: `languageCode` can be any string isn't defined in https://cloud.google.com/dialogflow/es/docs/reference/language but null or undefined
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          // Maximum detect intent text input length 256 characters
          text: input.slice(0, 256),
          languageCode: process.env.DAILOGFLOW_LANGUAGE || 'null',
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    return responses[0];
  } catch (error) {
    console.error(error);
  }
}
