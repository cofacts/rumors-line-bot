module.exports = {
  apps: [
    {
      name: 'heroku-line-bot',
      script: 'build/index.js',

      // From Heroku production
      // Can't use process.env directly, or it will mess up with pm2 internals
      updateEnv: true,

      // Set by Heroku or -1 to scale to max cpu core -1
      instances: process.env.WEB_CONCURRENCY || -1,
      autorestart: true,
      watch: false,
      max_memory_restart: `${process.env.WEB_MEMORY || 512}M`, // // Auto-restart if process takes more than XXmo

      // PM2 default (1.6s) doesn't give the old worker's SIGINT handler
      // (server.close() in src/index.js) enough time to stop accepting new
      // connections before PM2 SIGKILLs it, especially under the periodic
      // `pm2 reload all` cron. Give it real breathing room.
      kill_timeout: 15000,

      // App startup takes about 7s, longer than PM2's default 3s
      // listen_timeout. Without wait_ready, PM2 stops the old workers before
      // the new ones are listening, leaving a gap with no listeners during
      // `pm2 reload`. The app sends 'ready' once listening (src/index.js).
      wait_ready: true,
      listen_timeout: 15000,

      // https://devcenter.heroku.com/articles/optimizing-dyno-usage#node-js
      exec_mode: 'cluster',

      out_file: '/dev/null',
      error_file: '/dev/null',
    },
  ],
};
