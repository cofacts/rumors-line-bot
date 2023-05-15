import { TABLE } from 'rumors-db/bq/events';
import type { EventBatch } from 'rumors-db/bq/events';

/**
 * BigQuery client and schema
 */

import { BigQuery } from '@google-cloud/bigquery';

const bqDataset = new BigQuery().dataset(
  process.env.BIGQUERY_ANALYTICS_DATASET || ''
);

export function insertEventBatch(eventBatch: EventBatch) {
  return bqDataset.table(TABLE).insert(eventBatch);
}
