import fs from 'fs';
import path from 'path';
import { buildSchema } from 'graphql';
import { RenameTypes, wrapSchema } from '@graphql-tools/wrap';
import executor from './cofactsSchemaExecutor';

const cofactsSchema = wrapSchema({
  schema: buildSchema(
    fs.readFileSync(path.join(__dirname, `../../data/cofacts-api.graphql`), {
      encoding: 'utf-8',
    })
  ),
  executor,
  transforms: [new RenameTypes(name => `CofactsAPI${name}`)],
});

export default cofactsSchema;
