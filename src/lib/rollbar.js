import Rollbar from 'rollbar';
export default new Rollbar({
  accessToken: process.env.ROLLBAR_TOKEN,
  captureUncaught: true,
  captureUnhandledRejections: true,
  payload: { environment: process.env.ROLLBAR_ENV },
});
