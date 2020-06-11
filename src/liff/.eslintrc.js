module.exports = {
  env: {
    browser: true,
    node: false,
    jest: false,
  },
  globals: {
    // global scripts include in index.html
    rollbar: 'readonly',
    liff: 'readonly',

    // Define plugin
    LIFF_ID: 'readonly',
    DEBUG_LIFF: 'readonly',
  }
};
