/* eslint no-console: off */

// http://pm2.keymetrics.io/docs/usage/use-pm2-with-cloud-providers/#heroku-google-app-engine-azure
//

const pm2 = require('pm2');

// Set by Heroku or -1 to scale to max cpu core -1
const instances = process.env.WEB_CONCURRENCY || -1;
const maxMemory = process.env.WEB_MEMORY || 512;    // " " "

const DEV_CONFIG = {
  name: 'heroku-line-bot-local',
  script: 'src/index.js',
  env: process.env,
  watch: true,
  interpreter: './node_modules/.bin/babel-node',
};

const PRODUCTION_CONFIG = {
  name: 'heroku-line-bot',
  script: 'build/index.js',
  env: process.env,
  exec_mode: 'cluster',
  instances,
  max_memory_restart: `${maxMemory}M`,   // Auto-restart if process takes more than XXmo
};

pm2.connect(() => {
  pm2.start(process.env.NODE_ENV === 'production' ? PRODUCTION_CONFIG : DEV_CONFIG, (err) => {
    if (err) {
      console.error('Error while launching applications', err.stack || err);
      return;
    }
    console.log('PM2 and application has been succesfully started');

    // Display logs in standard output
    pm2.launchBus((busErr, bus) => {
      console.log('[PM2] Log streaming started');

      bus.on('log:out', (packet) => {
        console.log('[App:%s] %s', packet.process.name, packet.data);
      });

      bus.on('log:err', (packet) => {
        console.error('[App:%s][Err] %s', packet.process.name, packet.data);
      });
    });
  });
});
