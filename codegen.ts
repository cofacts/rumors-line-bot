import { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './src/graphql/cofacts-api.graphql',
  documents: ['src/**/*.ts', 'src/**/*.graphql'],
  generates: {
    './typegen/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        enumsAsTypes: true,
        immutableTypes: true,
        skipTypename: true,
        avoidOptionals: true,
      },
    },
  },
};
export default config;
