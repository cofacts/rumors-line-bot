import { BigQuery } from '@google-cloud/bigquery';
import { TABLE } from 'src/rumors-db/bq/events';
import type { EventBatch } from 'src/rumors-db/bq/events';

/**
 * BigQuery cliens
 */
const bqDataset = new BigQuery().dataset(
  process.env.BIGQUERY_ANALYTICS_DATASET || ''
);

export function insertEventBatch(eventBatch: EventBatch) {
  return bqDataset.table(TABLE).insert(eventBatch);
}
