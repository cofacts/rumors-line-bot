const path = require('path');

module.exports = {
  stories: [
    '../src/**/*.stories.mdx',
    '../src/**/*.stories.@(js|jsx|ts|tsx|svelte)',
  ],
  addons: [
    '@storybook/addon-links',
    {
      name: '@storybook/addon-essentials',
      options: {
        backgrounds: false,
        toolbars: false,
      },
    },
    '@storybook/addon-svelte-csf',
  ],
  webpackFinal: async config => {
    // Enable project root import paths like 'src/lib/sharedUtils'
    // Ref: https://stackoverflow.com/a/65772747/1582110
    config.resolve.modules.push(path.resolve(__dirname, '../'));

    config.module.rules.push({
      test: /\.scss$/,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'sass-loader',
          options: {
            sassOptions: {
              // Process svelte-material-ui SCSS files in node_modules as well
              includePaths: [
                path.resolve(__dirname, '../node_modules'),
                path.resolve(__dirname, '../src/liff'),
              ],
            },
          },
        },
      ],
    });

    return config;
  },
};
