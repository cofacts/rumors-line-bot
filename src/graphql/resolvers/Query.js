export default {
  insights() {
    // Resolvers in next level
    return {};
  },

  context(root, args, context) {
    return context.userContext;
  },
};
