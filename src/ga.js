import ua from 'universal-analytics';

// params = {ec: "Event Category", ea: "Event Action", el: "…and a label", ev: 42, dp: "/contact"}
export default function(userId, params) {
  const visitor = ua(process.env.GA_ID, userId, { strictCidFormat: false });
  visitor.event(params).send();
}
