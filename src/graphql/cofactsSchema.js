import fs from 'fs';
import path from 'path';
import { print, buildSchema } from 'graphql';
import { RenameTypes, wrapSchema } from '@graphql-tools/wrap';

import gql from '../lib/gql';

const executor = ({ document, variables }) =>
  gql`
    ${print(document)}
  `(variables);

const cofactsSchema = wrapSchema({
  schema: buildSchema(
    fs.readFileSync(path.join(__dirname, `./cofacts-api.graphql`), {
      encoding: 'utf-8',
    })
  ),
  executor,
  transforms: [new RenameTypes(name => `CofactsAPI${name}`)],
});

export default cofactsSchema;
