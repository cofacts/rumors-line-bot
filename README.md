# rumors-line-bot
Line bot that checks if a message contains internet rumor.

[![Build Status](https://travis-ci.org/cofacts/rumors-line-bot.svg?branch=dev)](https://travis-ci.org/cofacts/rumors-line-bot) [![Coverage Status](https://coveralls.io/repos/github/cofacts/rumors-line-bot/badge.svg?branch=dev)](https://coveralls.io/github/cofacts/rumors-line-bot?branch=dev)

## State diagram & Documents

This is a one of the sub-project of [真的假的](http://beta.hackfoldr.org/rumors)。

This state diagram describes how the LINE bot talks to users:

[![The state diagram](https://docs.google.com/drawings/d/1GIuprSEGpthMW6KuCgawMky5Nnxm7P7mlxeODPdA-lI/pub?w=1405&h=1116)](http://beta.hackfoldr.org/cofacts/https%253A%252F%252Fdocs.google.com%252Fdrawings%252Fd%252F1GIuprSEGpthMW6KuCgawMky5Nnxm7P7mlxeODPdA-lI%252Fedit)


## Development

Developing rumors-line-bot requires you to finish the following settings.

### LINE@ account & Developer accounts

Please follow all the steps in [LINE official tutorial](https://developers.line.me/messaging-api/getting-started).

### Environment variables

First, install heroku toolbelt.

Create `.env` file from `.env.sample` template, at least fill in:
```
API_URL=https://cofacts-api.g0v.tw/graphql
LINE_CHANNEL_SECRET=<paste LINE@'s channel secret here>
LINE_CHANNEL_TOKEN=<paste LINE@'s channel token here>
LIFF_URL=<paste LIFF app's LiFF URL>
```

Other customizable env vars are:

* `REDIS_URL`: If not given, `redis://127.0.0.1:6379` is used.
* `PORT`: Which port the line bot server will listen at.
* `GOOGLE_DRIVE_IMAGE_FOLDER`: Google drive folder id is needed when you want to test uploading image.
* `GOOGLE_CREDENTIALS`: will be populated by `authGoogleDrive.js`. See "Upload image/video" section below.
* `GA_ID`: Google analytics universal analytics tracking ID, for tracking events
* `IMAGE_MESSAGE_ENABLED`: Default disabled. To enable, please see "Process image message" section below.

### Redis server

We use Redis to store conversation context / intents. Please run a Redis server on your machine, or use the Heroku Redis's `REDIS_URL` directly if you happen to deploy the bot to Heroku.

### Node Dependencies

You will need `Node.JS` 8+  to proceed.

```
$ npm i
```

### Get the bot server running on your local machine

```
$ npm run dev
```

and the server will be started on `localhost:5001`. (Or the `PORT` you specified in your `.env` file.)

### Get LINE messages to your local machine

We recommend [using `ngrok`](https://medium.com/@Oskarr3/developing-messenger-bot-with-ngrok-5d23208ed7c8#.csc8rum8s) to create a public address that directs the traffic from LINE server to your local machine. With `ngrok` in your path, just

```
$ ngrok http 5001
```

`ngrok` will give you a public URL. Use this to set the webhook URL of your Channel (See the section "Channel Console" in [LINE official tutorial](https://developers.line.me/messaging-api/getting-started)).

We recommend using [ngrok configuration file](https://ngrok.com/docs#config) to setup a tunnel with a fixed `subdomain`. In this way the public URL can be fixed (means no repeatitive copy-pasting to LINE Channel settings!) as long as the `subdomain` is not occupied by others.

### LIFF setup

We are using LIFF to collect user's reason when submitting article & negative feedbacks.

It is accessible under `/liff` of dev server (http://localhost:5001) or production chatbot server.

In development mode, it spins a webpack-dev-server on `localhost:<LIFF_DEV_PORT>` (default to `8080`),
and `/liff` of chatbot server proxies all requests to the webpack-dev-server.

In production, LIFF files are compiled to `/liff` directory and served as static files by the chatbot server.

To connect with chatbot, some setup on [LINE developer console](https://developers.line.biz/console/) are required.

### Process image message(using Tesseract-OCR)

[Install tesseract-ocr binary](https://github.com/tesseract-ocr/tesseract/wiki) and set `IMAGE_MESSAGE_ENABLED` to `true`. If you are going to deploy linebot on heroku, you should [use buildpack](https://github.com/cofacts/rumors-line-bot#tesseract-ocr-on-heroku).

Note : Linebot will temporarily save both image and tesseract output file in `tmp_image_process` folder every time image message sends in. If you develop through `npm run dev`, you should set `autorestart` and `watch` in ecosystem.dev.config.js to false.

### Upload image/video

First, follow the step1 in this [url](https://developers.google.com/drive/v3/web/quickstart/nodejs) to get `client_secret.json` and save it to project root.

Second, run:

```
$ node authGoogleDrive.js
```

Visit the given url provided above. Get the auth code and paste it to console.
Then the program will save your google drive access_token locally at `GOOGLE_CREDENTIALS` in `.env`.

Make sure you've also set `GOOGLE_DRIVE_IMAGE_FOLDER` = [folderID](https://googleappsscriptdeveloper.wordpress.com/2017/03/04/how-to-find-your-google-drive-folder-id/) in .env file.

ref:

[OAuth2 Protocols](https://developers.google.com/identity/protocols/OAuth2)

[Googleapi Nodejs Client](https://github.com/google/google-api-nodejs-client)   P.S. This page provide the newest api usage then [this](https://developers.google.com/drive/v3/web/quickstart/nodejs).

### Translation

We use [ttag](https://ttag.js.org/) to support build-time i18n for the chatbot.

Please refer to ttag documentation for [annotating strings to translate](https://ttag.js.org/docs/quickstart.html).

To extract annotated strings to translation files, use:

```
$ npm run i18n:extract
```

#### Translation files

The translation files are located under `i18n/`, in [Gettext PO format](https://www.gnu.org/software/gettext/manual/html_node/PO-Files.html).

- `en_US.po`: Since the language used in code is already English, this empty translation file exists to simplify settings.
- `zh_TW.po`: Traditional Chinese translation.

#### Supporting other languages

You can replace this with [any language](https://www.gnu.org/software/gettext/manual/html_node/Locale-Names.html) you want to support, by leveraging Gettext [`msginit` command](https://www.gnu.org/software/gettext/manual/html_node/msginit-Invocation.html).

You will need to change `i18n:extract` and `i18n:validate` script in `package.json` to reflect the locale change.

#### Building in different languages

By default, the chatbot will be built under `en_US` locale.

On Heroku, please set `LOCALE` to one of `en_US`, `zh_TW` or any other language code that exists under `i18n/` directory.

If you want to build using docker instead, you may need to modify Dockerfile to include the desired `LOCALE`.

---

## Production Deployment

If you would like to start your own LINE bot server in production environment, this section describes how you can deploy the line bot to your own Heroku account.

### Get the server running

You can deploy the line bot server to your own Heroku account by [creating a Heroku app and push to it](https://devcenter.heroku.com/articles/git#creating-a-heroku-remote).

Despite the fact that we don't use `Procfile`, Heroku still does detection and installs the correct environment for us.

### Provision add-on "Heroku Redis"

[Provision a Heroku Redis addon](https://elements.heroku.com/addons/heroku-redis) to get redis. It sets the env var `REDIS_URL` for you.

### Tesseract-ocr on heroku

[Install heroku tesseract buildpack](https://github.com/cofacts/heroku-buildpack-tesseract) and set var `IMAGE_MESSAGE_ENABLED` to `true`.

### Configurations

You will still have to set the following config vars manually:

```
$ heroku config:set API_URL=https://cofacts-api.g0v.tw/graphql
$ heroku config:set SITE_URL=https://cofacts.g0v.tw
$ heroku config:set LINE_CHANNEL_SECRET=<Your channel secret>
$ heroku config:set LINE_CHANNEL_TOKEN=<Your channel token>
$ heroku config:set GOOGLE_CREDENTIALS=<Your google credential (optional)>
$ heroku config:set LIFF_URL=<LIFF URL>
$ heroku config:set IMAGE_MESSAGE_ENABLED=true
```

## Google Analytics Events table

Sent event format: `Event category` / `Event action` / `Event label`

1. User sends a message to us
  - `UserInput` / `MessageType` / `<text | image | video | ...>`
  - For the time being, we only process message with "text" type. The following events only applies
    for text messages.

  - If we found a articles in database that matches the message:
    - `UserInput` / `ArticleSearch` / `ArticleFound`
    - `Article` / `Search` / `<article id>` for each article found
  - If the message does not look like those being forwarded in instant messengers:
    - `UserInput` / `ArticleSearch` / `NonsenseText`
  - If nothing found in database:
    - `UserInput` / `ArticleSearch` / `ArticleNotFound`

2. User chooses a found article
  - `Article` / `Selected` / `<selected article id>`
  - If there are replies:
    - `Reply` / `Search` / `<reply id>` for each replies
  - If there are no replies:
    - `Article` / `NoReply` / `<selected article id>`

3. User chooses a reply
  - `Reply` / `Selected` / `<selected reply id>`
  - `Reply` / `Type` / `<selected reply's type>`

4. User votes a reply
  - `UserInput` / `Feedback-Vote` / `<articleId>/<replyId>`

5. User want to submit a new article
  - `Article` / `Create` / `Yes`

6. User does not want to submit an article
  - `Article` / `Create` / `No`
