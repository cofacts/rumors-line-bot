/**
 * BigQuery client and schema
 */

import { BigQuery } from '@google-cloud/bigquery';

const bqDataset = new BigQuery().dataset(
  process.env.BIGQUERY_ANALYTICS_DATASET || ''
);

export function insertEventBatch(eventBatch: EventBatch) {
  const table = bqDataset.table(TABLE);
  return table.insert(eventBatch, { schema: bqSchema });
}
