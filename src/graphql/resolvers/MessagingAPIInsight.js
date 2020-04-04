import { Client } from '@line/bot-sdk';

const client = new Client({
  channelAccessToken: process.env.LINE_CHANNEL_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
});

export default {
  messageDelivery(_, { date }) {
    return client.getNumberOfMessageDeliveries(date);
  },
  followers(_, { date }) {
    return client.getNumberOfFollowers(date);
  },
  demographic(_, { date }) {
    return client.getFriendDemographics(date);
  },
};
