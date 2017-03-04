# rumors-line-bot
Line bot that checks if a message contains internet rumor.

## Dev

### Environment variables

First, install heroku toolbelt.

Create .env file, copy the template below and `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_TOKEN` inside.
```
API_URL=http://api.rumors.hacktabl.org/graphql
LINE_CHANNEL_SECRET=<paste LINE@'s channel secret here>
LINE_CHANNEL_TOKEN=<paste LINE@'s channel token here>
```

Other customizable env vars are:

* `REDIS_URL`: If not given, `redis://127.0.0.1:6379` is used.
* `PORT`: Which port the line bot server will listen at.

### Dependencies

You will need `Node.JS` 6+ and `yarn` to proceed.

```
$ yarn
```

You will also need a redis server running on `redis://127.0.0.1:6379` (Can be overridden on `REDIS_URL`)

Then,

```
$ heroku local
```

and the server will be started on `localhost:5000`. (Or the `PORT` you specified in your `.env` file.)

You may start `ngrok` and update your Line Messenging Channel.
