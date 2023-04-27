require('dotenv').config();

module.exports = {
  apps: [
    {
      name: 'heroku-line-bot-local',
      script: 'src/index.js',

      // From .env
      // Can't use process.env directly, or it will mess up with pm2 internals
      env: Object.assign({}, process.env),

      autorestart: true,
      watch: ['src/'],
      // Don't reload server for LIFF changes
      ignore_watch: ['src/liff'],
      interpreter: './node_modules/.bin/babel-node',
      interpreter_args: '--extensions .ts,.js',
    },
  ],
};
