export default {
  from({ age }) {
    const match = age.match(/^from(\d+)/);

    return match && +match[1];
  },
  to({ age }) {
    const match = age.match(/to(\d+)$/);
    return match && +match[1];
  },
};
