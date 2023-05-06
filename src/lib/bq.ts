/**
 * BigQuery client and schema
 */

import { z } from 'zod';
import { convert } from 'zoq';
import { BigQuery } from '@google-cloud/bigquery';

const bqDataset = new BigQuery().dataset(
  process.env.BIGQUERY_ANALYTICS_DATASET || ''
);

const TABLE_PREFIX = 'analytics_';

export const analyticsSchema = z.object({
  createdAt: z.date().describe('Time of the event batch is sent'),
  text: z.string().describe('Message text'),
  messageSource: z.enum(['user', 'group', 'room']),
  events: z.array(
    z.object({
      time: z.date().describe('Time of the event'),
      category: z.string().nullable().describe('Event category'),
      action: z.string().nullable().describe('Event action'),
      label: z.string().nullable().describe('Event label'),
    })
  ),
});

const bqSchema = convert(analyticsSchema);

/**
 * Create table with TABLE_PREFIX and the current month in YYYY_MM format
 */
function getTableName(): string {
  return `${TABLE_PREFIX}${new Date()
    .toISOString()
    .slice(0, 7)
    .replaceAll('-', '')}`;
}

export type EventBatch = z.infer<typeof analyticsSchema>;

export function insertAnalytics(eventBatch: EventBatch) {
  const table = bqDataset.table(getTableName());
  return table.insert(eventBatch, { schema: bqSchema });
}
