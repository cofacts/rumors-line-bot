# rumors-line-bot
Line bot that checks if a message contains internet rumor.

[![CI test](https://github.com/cofacts/rumors-line-bot/actions/workflows/ci.yml/badge.svg)](https://github.com/cofacts/rumors-line-bot/actions/workflows/ci.yml)
 [![Coverage Status](https://coveralls.io/repos/github/cofacts/rumors-line-bot/badge.svg?branch=master)](https://coveralls.io/github/cofacts/rumors-line-bot?branch=master)

## State diagram & Documents

This is a one of the sub-project of [真的假的](https://beta.hackfoldr.org/cofacts)。

This state diagram describes how the LINE bot talks to users:

[![The state diagram](https://docs.google.com/drawings/d/e/2PACX-1vTeXGMSaPQadbe7kXay6n0vWWKHbLrMWtNB1xWuuH7SEO9KlPjDSML_TZgcuk6_kpsGLwM6YlosB1MI/pub?w=1428&amp;h=1057)](https://docs.google.com/drawings/d/1sSzI0PSggkA3PPP99Nl18H4zMO4lk-2y5s7dGRNJwAE/edit)


## Development

Developing rumors-line-bot requires you to finish the following settings.

### LINE channels & Developer accounts

Please follow all the steps in [LINE official tutorial](https://developers.line.biz/en/docs/messaging-api/getting-started/).

### Environment variables

Create `.env` file from `.env.sample` template, at least fill in:
```
API_URL=https://dev-api.cofacts.tw/graphql
LINE_CHANNEL_SECRET=<paste Messaging API's channel secret here>
LINE_CHANNEL_TOKEN=<paste Messaging API's channel access token here>
LINE_LOGIN_CHANNEL_ID=<paste LINE Login channel ID here>
LIFF_URL=<paste LIFF app's LiFF URL>
```

Other customizable env vars are:

* `REDIS_URL`: If not given, `redis://127.0.0.1:6379` is used.
* `PORT`: Which port the line bot server will listen at.
* `GA_ID`: Google analytics tracking ID, for tracking events. You should also add custom dimensions and metrics, see "Google Analytics Custom dimensions and metrics" section below.
* `DEBUG_LIFF`: Disables external browser check in LIFF. Useful when debugging LIFF in external browser. Don't enable this on production.
* `RUMORS_LINE_BOT_URL`: Server public url which is used to generate tutorial image urls and auth callback url of LINE Notify.

### Node Dependencies

You will need `Node.JS` 16+ to proceed.

```
$ npm i
```

### Get the bot server running on your local machine

Spin up peripherals like Redis and MongoDB using:

```
$ docker-compose up -d
```

Then spin up the application, including chatbot server and webpack-dev-server for LIFF, using:
```
$ npm run dev
```

The server will be started on `localhost:5001` (or the `PORT` you specified in your `.env` file.)

If you wish to stop the peripherals, run `docker-compose stop`.

### Get LINE messages to your local machine

We recommend [using `ngrok`](https://medium.com/@Oskarr3/developing-messenger-bot-with-ngrok-5d23208ed7c8#.csc8rum8s) to create a public address that directs the traffic from LINE server to your local machine. With `ngrok` in your path, just

```
$ ngrok http 5001
```

`ngrok` will give you a public URL. Use this to set the webhook URL of your Channel (See the section "Channel Console" in [LINE official tutorial](https://developers.line.biz/en/docs/messaging-api/getting-started/)).

We recommend using [ngrok configuration file](https://ngrok.com/docs#config) to setup a tunnel with a fixed `subdomain`. In this way the public URL can be fixed (means no repeatitive copy-pasting to LINE Channel settings!) as long as the `subdomain` is not occupied by others.

### LIFF setup

We are using LIFF to collect user's reason when submitting article & negative feedbacks.

If you don't need to develop LIFF, you can directly use `LIFF_URL` provided in `.env.sample`, which links to staging LIFF site.

If you want to modify LIFF, you may need to follow these steps:

#### Creating your own LIFF app

To create LIFF apps, please follow instructions under [official document](https://developers.line.biz/en/docs/liff/getting-started/), which involves
- Creating a LINE login channel
- Select `chat_message.write` in scope (for LIFF to send messages)
After acquiring LIFF URL, place it in `.env` as `LIFF_URL`.
- Set `Endpoint URL` to start with your chabbot endpoint, and add `/liff/index.html` as postfix.

#### Developing LIFF

To develop LIFF, after `npm run dev`, it is accessible under `/liff/index.html` of dev server (http://localhost:5001) or production chatbot server.

In development mode, it spins a webpack-dev-server on `localhost:<LIFF_DEV_PORT>` (default to `8080`),
and `/liff` of chatbot server proxies all requests to the webpack-dev-server.

A tip to develop LIFF in browser is:
1. Visit `https://<your-dev-chatbot.ngrok.io>/liff/index.html?p=<page>&...` in desktop browser.
2. If your browser has not logged in LINE, LIFF SDK will redirect your desktop browser window to login page.
3. If your browser logged in LINE for a while, it is possible that your session has timed out. LINE LIFF does not log you out automatically; you will need to type `liff.logout()` manually in JS console to trigger a re-login.

`liff.init()` would still work in desktop browser, so that the app renders, enabling us to debug web layouts on desktop.
`liff.sendMessages()` would not work, though.
`liff.closeWindow()` will not work either if your browser window has gone through login redirects.

#### GraphQL API for LIFF

The LINE bot server starts a GraphQL server that stiches Cofacts GraphQL API and API specific to the LINE chatbot.

Whenever Cofacts API updates, use `npm run cofactsapi` to fetch the latest Cofacts API schema.

#### LIFF components storybook

During development, use the following command to start a storybook on your local machine:
```
npm run storybook # Then visit http://localhost:6006
```

You can also visit https://cofacts.github.io/rumors-line-bot for pre-built storybook on `master` branch.

#### How LIFF is deployed on production

On production, LIFF files are compiled to `/liff` directory and served as static files by the chatbot server.

If you get `400 bad request` in LIFF, please search for `liff.init` function call in compiled JS binary and see
if LIFF ID is consistent with your LIFF URL, which should be the path without leading `https://liff.line.me/`.

The LIFF ID is set using Webpack Define plugin during build,
thus swapping LIFF URL env variable without rebuilding the LIFF binaries will cause 400 bad request.

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
- `ja.po`: Japanese translation.

#### Supporting other languages

You can replace this with [any language](https://www.gnu.org/software/gettext/manual/html_node/Locale-Names.html) you want to support, by leveraging Gettext [`msginit` command](https://www.gnu.org/software/gettext/manual/html_node/msginit-Invocation.html).

You will need to change `i18n:extract` and `i18n:validate` script in `package.json` to reflect the locale change.

#### Building in different languages

By default, the chatbot will be built under `en_US` locale.

On Heroku, please set `LOCALE` to one of `en_US`, `zh_TW` or any other language code that exists under `i18n/` directory.

If you want to build using docker instead, you may need to modify Dockerfile to include the desired `LOCALE`.

### Notification setup
- Prerequisites :
  1. [LIFF setup](https://github.com/cofacts/rumors-line-bot#liff-setup)
  2. Connect MongoDB

- To use [push message](https://developers.line.biz/en/reference/messaging-api/#send-push-message) :
  in `.env` file, sets `NOTIFY_METHOD=PUSH_MESSAGE`

- To use [LINE Notify](https://notify-bot.line.me/en/) :
  1. You should first [register a service](https://notify-bot.line.me/my/services/).
  2. Then sets up `Callback Url` : `RUMORS_LINE_BOT_URL`/authcallback/line_notify
  3. in `.env` file, sets
      ```
      LINE_NOTIFY_CLIENT_ID=<paste LINE Notify Client ID here>
      LINE_NOTIFY_CLIENT_SECRET=<paste LINE Notify Client Secret here>
      NOTIFY_METHOD=LINE_NOTIFY
      RUMORS_LINE_BOT_URL=<line bot server url>
      LINE_FRIEND_URL=https://line.me/R/ti/p/<paste your chatbot ID here>
      ```

You can set up a setting page entry point(`LIFF_URL`?p=setting) in [account manager](https://manager.line.biz/account/) -> rich menu

#### Notification cronjob
- To run on local machine
```
$ npm run notify
```
- To run on heroku, you can use [heroku scheduler](https://elements.heroku.com/addons/scheduler)
```
$ node build/scripts/scanRepliesAndNotify.js
```

### Dialogflow

We use dialogflow to detect if user is chatting with bot.
If userinput matches one of dialogflow intents, we can directly return predefined responses in that intent.

To use Dialogflow,

1. You should [create a project](https://cloud.google.com/dialogflow/es/docs/quick/setup#project) and take note of the project ID then [enable api](https://cloud.google.com/dialogflow/es/docs/quick/setup#api).
2. [Build an agent](https://cloud.google.com/dialogflow/es/docs/quick/build-agent).
3. You will get a JSON file after [seting up authentication](https://cloud.google.com/dialogflow/es/docs/quick/setup#auth), copy `client_email` and `private_key` in the file.
4. sets in `.env` file

    ```
    DAILOGFLOW_CLIENT_EMAIL=<paste client_email get from step3 here>
    DAILOGFLOW_PRIVATE_KEY=<paste private_key get from step3 here>
    DAILOGFLOW_PROJECT_ID=<paste project_id get from step1 here>
    ```

    Optional env variables:
    - `DAILOGFLOW_LANGUAGE` : Empty to agent's default language, or you can specify a [language](https://cloud.google.com/dialogflow/es/docs/reference/language).
    - `DAILOGFLOW_ENV` : Default to draft agent, or you can create different [versions](https://cloud.google.com/dialogflow/es/docs/agents-versions).

### Google Analytics Custom dimensions and metrics

[Create](https://support.google.com/analytics/answer/2709829) a custom (user scope) dimemsion for `Message Source`, and a custom (hit scope) metrix for `Group Members Count`. Both of them default index is 1. If the indexes GA created are not 1, find `cd1` and `cm1` in the code and change them to `cd$theIndexGACreated` and `cm$theIndexGACreated` respectively.

---

## Production Deployment

You have two deployment options:

### Option 1. Build docker image & deploy using docker-compose

Prepare `.env` file (which should be identical to your deployment environment) and run `docker build .` to generate docker image.

`.env` will be copied over to the builder image to generate LIFF static file with the env.
When building image, you can just include the "Build-time variables" (denoted in `.env.sample`) in `.env` to ensure that no server credentials are leaked in the built client code.

Since built docker images will encode public URLs into statically built files, these build-time variables when we run the image as a container. Therefore, each separate deployment environment will require a separate build of the image.

You can test the built image locally using the `docker-compose.yml`; just uncomment the line bot section and provide the built image name.

For production, please see [rumors-deploy](https://github.com/cofacts/rumors-deploy/) for sample `docker-coompose.yml` that runs such image.

### Option 2. Deploy to Heroku

If you would like to start your own LINE bot server in production environment, this section describes how you can deploy the line bot to your own Heroku account.

#### Get the server running

You can deploy the line bot server to your own Heroku account by [creating a Heroku app and push to it](https://devcenter.heroku.com/articles/git#creating-a-heroku-remote).

Despite the fact that we don't use `Procfile`, Heroku still does detection and installs the correct environment for us.

#### Prepare storage services

##### Redis

We use Redis to store conversation context.

Use the env var `REDIS_URL` to specify how chatbot should link to the Redis server.

On Heroku, you can [provision a Heroku Redis addon](https://elements.heroku.com/addons/heroku-redis) to get redis.
It sets the env var `REDIS_URL` for you.

##### MongoDB

We use MongoDB to store users' visited posts. It's the data source for related GraphQL APIs.

Use the env var `MONGODB_URI` to specify your MongoDB's connection string.

[MongoDB Atlas Free Tier cluster](https://docs.atlas.mongodb.com/tutorial/deploy-free-tier-cluster/) to start with.

#### Configurations

Besides previously mentioned `MONGODB_URI` and `REDIS_URL`,
you will still have to set the following config vars manually:

```
$ heroku config:set API_URL=https://api.cofacts.tw/graphql
$ heroku config:set SITE_URLS=https://cofacts.tw
$ heroku config:set LINE_CHANNEL_SECRET=<Your channel secret>
$ heroku config:set LINE_CHANNEL_TOKEN=<Your channel token>
$ heroku config:set LIFF_URL=<LIFF URL>
$ heroku config:set FACEBOOK_APP_ID=<Facebook App ID for share dialog>
$ heroku config:set JWT_SECRET=<arbitary secret string>
```

Consult `.env.sample` for other optional env vars.

## Google Analytics Events table

Sent event format: `Event category` / `Event action` / `Event label`

We use dimemsion `Message Source` (Custom Dimemsion1) to classify different event sources
- `user` for 1 on 1 messages
- `room` | `group` for group messages

### 1 on 1 messages

1. User sends a message to us
  - `UserInput` / `MessageType` / `<text | image | video | ...>`
  - For the time being, we only process message with "text" type. The following events only applies
    for text messages.

  - If we found a articles in database that matches the message:
    - `UserInput` / `ArticleSearch` / `ArticleFound`
    - `Article` / `Search` / `<article id>` for each article found
  - If nothing found in database:
    - `UserInput` / `ArticleSearch` / `ArticleNotFound`
  - If articles found in database but is not what user want:
    - `UserInput` / `ArticleSearch` / `ArticleFoundButNoHit`
  - When user provides source
    - `UserInput` / `IsForwarded` / `Yes` | `No`
  - Matches one of Dialogflow intents
    - `UserInput` / `ChatWithBot` / `<intent name>`

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
  - When the LIFF opens, page view for page `/feedback/yes` or `/feedback/no` is also sent.

5. User want to submit a new article
  - `Article` / `Create` / `Yes`

6. User does not want to submit an article
  - `Article` / `Create` / `No`

7. User updates their reason of reply request
  - `Article` / `ProvidingReason` / `<articleId>`
  - When the LIFF opens, page view for page `/reason` is also sent.

8. User opens article list
  - Page view for page `/articles` is sent
  - If opened via rich menu: `utm_source=rumors-line-bot&utm_medium=richmenu`
  - If opened via push message: `utm_source=rumors-line-bot&utm_medium=push`

9. When user clicks viewed article item in article list
  - `LIFF` / `ChooseArticle` / `<articleId>`
  - Note: this event is dispatched in LIFF, thus URL params like `utm_source`, `utm_medium` also applies.

10. User opens settings list
  - Page view for page `/setting` is sent
  - If opened after sending reply requests: `utm_source=rumors-line-bot&utm_medium=reply-request`
  - If opened in tutorial: `&utm_source=rumors-line-bot&utm_medium=tutorial`

11. Other LIFF operations
  - `LIFF` / `page_redirect` / `App` is sent on LIFF redirect, with value being redirect count.
  - `LIFF` / `ViewArticle` / `<articleId>` when article page with `articleId` is opened
  - `LIFF` / `Comment` / `<articleId>` when comment page with `articleId` is opened
  - `LIFF` / `ViewReply` / `<replyId>` for each displayed reply in article page

12. Tutorial
  - If it's triggered by follow event (a.k.a add-friend event)
    - `Tutorial` / `Step` / `ON_BOARDING`
  - If it's triggered by rich menu
    - `Tutorial` / `Step` / `RICH_MENU`
  - Others
    - `Tutorial` / `Step` / `<TUTORIAL_STEPS>`

### Group messages

1. When chatbot joined/leaved a group or a room
  - Join
    - `Group` / `Join` / `1` (`Event category` / `Event action` / `Event value`)
    - And `Group Members Count` (Custom Metric1) to record group members count when chatbot joined.
  - Leave
    - `Group` / `Leave` / `-1` (`Event category` / `Event action` / `Event value`)
  > Note:
  >
  > 1. We set ga event value 1 as join, -1 as leave.
  >    To know total groups count chatbot currently joined, you can directly see the total event value (Details see [Implicit Count](https://support.google.com/analytics/answer/1033068?hl=en)).
  > 2. To know a group is currently joined or leaved, you should find the last `Join` or `Leave` action of the `Client Id`.
  > 3. Also, you should find the last `Join` action of the `Client Id` to get a more accurate `Group Members Count`.
  > `Group Members Count` is only recorded when chatbot joined group, to know the exact count, you should directly get it from [line messaging-api](https://developers.line.biz/en/reference/messaging-api/#get-members-group-count).

2. User sends a message to us
  - If we found a articles in database that matches the message:
    - `UserInput` / `ArticleSearch` / `ArticleFound`
    - `Article` / `Search` / `<article id>` for each article found
  - If the article is identical
    - `Article` / `Selected` / `<selected article id>`
  - If the article has a valid category and the reply is valid (Details see [#238](https://github.com/cofacts/rumors-line-bot/pull/238))
    - `Reply` / `Selected` / `<selected reply id>`

3. User trigger chatbot to introduce itself:
  - `UserInput` / `Intro` /

### Others

1. LINE content proxy URL is being accessed: `ContentProxy` / `Forward` / `<content type>` / `<content length>` (value)

## Legal

`LICENSE` defines the license agreement for the source code in this repository.

`LEGAL.md` is the user agreement for Cofacts website users.
