export default {
  withinDays({ subscriptionPeriod }) {
    const match = subscriptionPeriod.match(/^within(\d+)days$/);
    if (match) return +match[1];

    return subscriptionPeriod === 'over365days' ? -1 : null;
  },
};
