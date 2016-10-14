# rumors-line-bot
Line bot that checks if a message contains internet rumor.

## Dev

First, install heroku toolbelt.

Create .env file, fill up `LINE_CHANNEL_SECRET`, `LINE_CHANNEL_TOKEN`, `GSE_ID` and `GSE_KEY` inside.

Then,

```
$ heroku local
```

and the server will be started on `localhost:5000`.

You may start `ngrok` and update your Line Messenging Channel.
