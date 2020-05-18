// Project-wide config
//
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
      },
    ],
  ],
  plugins: [
    [
      'ttag',
      { resolve: { translations: `i18n/${process.env.LOCALE || 'en_US'}.po` } },
    ],
    ['module-resolver', { root: ['./'] }],
    '@babel/plugin-proposal-class-properties',
  ],
};
