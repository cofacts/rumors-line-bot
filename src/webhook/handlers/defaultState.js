export default function defaultState(params) {
  let { data, event, userId, replies } = params;

  replies = [
    {
      type: 'text',
      text: '我們看不懂 QQ\n大俠請重新來過。',
    },
  ];
  return { data, event, userId, replies };
}
