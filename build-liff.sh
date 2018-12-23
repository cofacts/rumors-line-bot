#!/bin/sh

# This file replaces liff/index.html's endpoint to staging & production LINE bot servers

sed 's/rumor-line-bot.ngrok.io/rumors-line-bot-staging.herokuapp.com/g' <liff/index.html >liff/staging.build.html
sed 's/rumor-line-bot.ngrok.io/rumors-line-bot.herokuapp.com/g' <liff/index.html >liff/production.build.html
