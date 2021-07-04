const locale = process.env.LOCALE || 'en_US';

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
    ['ttag', { resolve: { translations: `i18n/${locale}.po` } }],
    ['module-resolver', { root: ['./'] }],
    '@babel/plugin-proposal-class-properties',
  ],
};
