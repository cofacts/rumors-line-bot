module.exports = {
  parser: 'babel-eslint',
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'prettier',
  ],
  env: { node: true, es6: true, jest: true },
  plugins: ['prettier', 'import'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        trailingComma: 'es5',
        singleQuote: true,
      },
    ],
    'no-console': 'off', // just use console :P
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts'],
    },
    'import/resolver': {
      'babel-module': {},
      typescript: {},
    },
  },
  overrides: [
    {
      files: ['**/*.ts'],
      extends: ['plugin:@typescript-eslint/recommended'],
      plugins: ['@typescript-eslint'],
      rules: {
        '@typescript-eslint/no-misused-promises': [
          'error', // Helps capturing errors like if(someAsyncFunc())
          {
            checksVoidReturn: false, // Allow setTimeout(async () => {})
          },
        ],
      },

      // Required by rules that requires type information.
      // Ref: https://typescript-eslint.io/linting/typed-linting/
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  ],
};
