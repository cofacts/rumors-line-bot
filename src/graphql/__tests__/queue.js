import { groupEventQueue, expiredGroupEventQueue } from 'src/lib/queues';
import { gql } from '../testUtils';
import MockDate from 'mockdate';

beforeEach(async () => {
  await groupEventQueue.removeJobs('*');
  await expiredGroupEventQueue.removeJobs('*');
});
afterAll(async () => {
  await groupEventQueue.removeJobs('*');
  await expiredGroupEventQueue.removeJobs('*');
  await groupEventQueue.close();
  await expiredGroupEventQueue.close();
});

it('returns info for empty queues', async () => {
  const result = await gql`
    {
      queue {
        queueName
        jobCounts {
          waiting
          active
          completed
          failed
          delayed
        }
        isPaused
        lastWaitingAt
        lastCompletedAt
      }
    }
  `();

  expect(result).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "queue": Array [
          Object {
            "isPaused": false,
            "jobCounts": Object {
              "active": 0,
              "completed": 0,
              "delayed": 0,
              "failed": 0,
              "waiting": 0,
            },
            "lastCompletedAt": null,
            "lastWaitingAt": null,
            "queueName": "groupEventQueue",
          },
          Object {
            "isPaused": false,
            "jobCounts": Object {
              "active": 0,
              "completed": 0,
              "delayed": 0,
              "failed": 0,
              "waiting": 0,
            },
            "lastCompletedAt": null,
            "lastWaitingAt": null,
            "queueName": "expiredGroupEventQueue",
          },
        ],
      },
    }
  `);
});

it('returns waiting job info', async () => {
  MockDate.set(612921600000);
  await groupEventQueue.add({ foo: 'bar' });
  await expiredGroupEventQueue.add({ foo: 'bar' });

  const resultQueued = await gql`
    {
      queue {
        queueName
        jobCounts {
          waiting
        }
        lastWaitingAt
      }
    }
  `();

  MockDate.reset();

  expect(resultQueued).toMatchInlineSnapshot(`
    Object {
      "data": Object {
        "queue": Array [
          Object {
            "jobCounts": Object {
              "waiting": 1,
            },
            "lastWaitingAt": 1989-06-04T00:00:00.000Z,
            "queueName": "groupEventQueue",
          },
          Object {
            "jobCounts": Object {
              "waiting": 1,
            },
            "lastWaitingAt": 1989-06-04T00:00:00.000Z,
            "queueName": "expiredGroupEventQueue",
          },
        ],
      },
    }
  `);
});
