/* eslint-env node */
module.exports = {
  env: {
    browser: true,
    node: false,
    jest: false,
  },
  plugins: ['svelte3'],
  overrides: [
    {
      files: ['*.svelte'],
      processor: 'svelte3/svelte3',
      rules: {
        // Not compatible with svelte3 plugin
        // https://github.com/sveltejs/eslint-plugin-svelte3/blob/master/OTHER_PLUGINS.md
        'prettier/prettier': 'off',
      },
    },
    {
      files: ['__tests__/*'],
      env: {
        jest: true,
        node: true,
      },
    },
  ],
  globals: {
    // global scripts include in index.html
    rollbar: 'readonly',
    liff: 'readonly',

    // Define plugin
    APP_ID: 'readonly',
    LIFF_ID: 'readonly',
    DEBUG_LIFF: 'readonly',
    COFACTS_API_URL: 'readonly',
    NOTIFY_METHOD: 'readonly',
  },
};
