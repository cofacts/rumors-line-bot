export default function defaultState(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  replies = [
    {
      type: 'text',
      text: '我們看不懂 QQ\n大俠請重新來過。',
    },
  ];
  state = '__INIT__';
  return { data, state, event, issuedAt, userId, replies, isSkipUser };
}
