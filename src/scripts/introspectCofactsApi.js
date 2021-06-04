import path from 'path';
import fs from 'fs';
import { introspectSchema } from '@graphql-tools/wrap';
import { printSchema } from 'graphql/utilities';
import executor from '../graphql/cofactsSchemaExecutor';

const PATH_PREFIX = '../../data';
fs.mkdirSync(path.join(__dirname, PATH_PREFIX), { recursive: true });
const OUTPUT = path.join(__dirname, `${PATH_PREFIX}/cofacts-api.graphql`);

introspectSchema(executor)
  .then(schema => {
    const sdl = printSchema(schema);

    fs.writeFileSync(
      OUTPUT,
      '# Generated from `npm run cofactsapi`\n\n' + sdl,
      {
        encoding: 'utf-8',
      }
    );
    console.log('Cofacts API schema written to', OUTPUT);
  })
  .catch(console.error);
