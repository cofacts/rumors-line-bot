jest.mock('src/lib/ga');
jest.mock('src/lib/gql');
jest.mock('src/webhook/lineClient');
jest.mock('../processGroupEvent');

import ga from 'src/lib/ga';
import gql from 'src/lib/gql';
import lineClient from 'src/webhook/lineClient';
import MockDate from 'mockdate';

import GroupHandler from '../groupHandler';
import processGroupEvent from '../processGroupEvent';
import crypto from 'crypto';
import { TimeoutError } from '../utils';

import jobData from '../__fixtures__/groupHandler';
import Bull from 'bull';

let jobQueue, expiredJobQueue;
beforeEach(async () => {
  ga.clearAllMocks();
  gql.__reset();
  lineClient.post.mockClear();
  processGroupEvent.mockClear();
  const queueKey = crypto.randomBytes(4).toString('hex');
  jobQueue = new Bull('test-job-' + queueKey, {
    redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  });
  expiredJobQueue = new Bull('test-expJob-' + queueKey, {
    redis: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  });
});

afterEach(async () => {
  // Clean all job channel
  // https://github.com/OptimalBits/bull/issues/709
  await emptyQueue(jobQueue);
  await emptyQueue(expiredJobQueue);
  await jobQueue.close();
  await expiredJobQueue.close();
});

beforeAll(async () => {
  MockDate.set(1462629480000);
});

afterAll(async () => {
  MockDate.reset();
});

it('should not reply if result.replies undefined', (done) => {
  const param = jobData.joinGroup;
  processGroupEvent.mockImplementationOnce(() => ({
    replyToken: param.replyToken,
    result: {
      replies: undefined,
    },
  }));
  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(param);
  jobQueue.on('drained', async () => {
    if ((await isQueueIdle(jobQueue)) && (await isQueueIdle(expiredJobQueue))) {
      // console.log('test 1 done ');
      expect(await jobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 1,
          "delayed": 0,
          "failed": 0,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 0,
          "delayed": 0,
          "failed": 0,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(processGroupEvent).toHaveBeenCalledTimes(1);
      expect(lineClient.post).toHaveBeenCalledTimes(0);
      done();
    }
  });
});

it('should reply', (done) => {
  const jobId = 'testId';
  const param = jobData.textMessage;
  processGroupEvent.mockImplementationOnce(() => ({
    replyToken: param.replyToken,
    result: {
      replies: { dd: 'a' },
    },
  }));
  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(param, { jobId });

  // Listen jobQueue.on('completed'),
  // this will run after gh.onCompleted
  // so we can test if the result of gh.onCompleted is correct
  jobQueue.on('completed', async (job) => {
    // console.log('test 2 completed, id ' + job.id);
    expect(job.id).toBe(jobId);
  });
  jobQueue.on('drained', async () => {
    if ((await isQueueIdle(jobQueue)) && (await isQueueIdle(expiredJobQueue))) {
      // console.log('test 2 done');
      expect(await jobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 1,
          "delayed": 0,
          "failed": 0,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 0,
          "delayed": 0,
          "failed": 0,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(processGroupEvent).toHaveBeenCalledTimes(1);
      expect(lineClient.post).toHaveBeenCalledTimes(1);
      done();
    }
  });
});

it('should jobQueue failed with TimeoutError and should not add job to expiredQueue', (done) => {
  const jobId = 'testId';
  const param = jobData.textMessage;
  processGroupEvent.mockImplementationOnce(() =>
    Promise.reject(new TimeoutError('mock processGroupEvent timeout error'))
  );
  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(param, { jobId });

  jobQueue.on('failed', async (job, e) => {
    // console.log('jobQueue.failed');
    expect(e instanceof TimeoutError).toBe(true);
    expect(e).toMatchInlineSnapshot(
      `[Error: mock processGroupEvent timeout error]`
    );
  });
  jobQueue.on('drained', async () => {
    if ((await isQueueIdle(jobQueue)) && (await isQueueIdle(expiredJobQueue))) {
      // console.log('test 3 done');
      expect(await jobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 0,
          "delayed": 0,
          "failed": 1,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 0,
          "delayed": 0,
          "failed": 0,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(processGroupEvent).toHaveBeenCalledTimes(1);
      expect(lineClient.post).toHaveBeenCalledTimes(0);
      done();
    }
  });
});

it('should jobQueue failed with TimeoutError and add job to expiredQueue', (done) => {
  const jobId = 'testId';
  const param = jobData.expiredTextMessage;
  processGroupEvent.mockImplementationOnce(() =>
    Promise.reject(new TimeoutError('mock processGroupEvent timeout error'))
  );
  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(param, { jobId });

  jobQueue.on('failed', async (job, e) => {
    // console.log('jobQueue.failed');
    expect(job.id).toBe(jobId);
    expect(e instanceof TimeoutError).toBe(true);
    expect(e).toMatchInlineSnapshot(`[Error: Event expired]`);
  });

  expiredJobQueue.on('failed', async (job, e) => {
    // console.log('expiredJobQueue.failed');
    expect(job.id).toBe(jobId);
    expect(e instanceof TimeoutError).toBe(true);
    expect(e).toMatchInlineSnapshot(
      `[Error: mock processGroupEvent timeout error]`
    );
  });
  expiredJobQueue.on('drained', async () => {
    if ((await isQueueIdle(jobQueue)) && (await isQueueIdle(expiredJobQueue))) {
      // console.log('test 4 done');
      expect(await jobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 0,
          "delayed": 0,
          "failed": 1,
          "paused": 0,
          "waiting": 0,
        }
      `);
      expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 0,
          "delayed": 0,
          "failed": 1,
          "paused": 0,
          "waiting": 0,
        }
      `);

      // called by expiredJobQueue but not jobQueue
      expect(processGroupEvent).toHaveBeenCalledTimes(1);
      expect(lineClient.post).toHaveBeenCalledTimes(0);
      done();
    }
  });
});

it('should pause expiredJobQueue when there are events comming in', (done) => {
  const param = jobData.textMessage;
  processGroupEvent.mockImplementation(async () => {
    await sleep(100);
    return Promise.resolve({
      replyToken: param.replyToken,
      result: {
        replies: { text: 'it`s rumor.' },
      },
    });
  });

  const fakeProcessor = jest.fn().mockImplementation(async () => {
    await sleep(100);
    return Promise.reject(
      new TimeoutError('mock processGroupEvent timeout error')
    );
  });

  // set concurrency 0, because the defined concurrency for each process function stacks up for the Queue.
  // details see https://github.com/OptimalBits/bull/blob/master/REFERENCE.md#queueprocess
  expiredJobQueue.process('fakeProcessor', 0, fakeProcessor);
  expiredJobQueue.add('fakeProcessor', {}, { jobId: 'testExpiredId1' });
  expiredJobQueue.add('fakeProcessor', {}, { jobId: 'testExpiredId2' });
  expiredJobQueue.add('fakeProcessor', {}, { jobId: 'testExpiredId3' });
  expiredJobQueue.add('fakeProcessor', {}, { jobId: 'testExpiredId4' });

  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  // event timestamp affects job queue
  gh.addJob(param, { jobId: 'successJobId' });
  jobQueue.on('active', async () => {
    // delay for expiredJobQueue to become paused
    await sleep(50);
    expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
      Object {
        "active": 1,
        "completed": 0,
        "delayed": 0,
        "failed": 0,
        "paused": 3,
        "waiting": 0,
      }
    `);

    // After jobQueue drained, expiredJobQueue will continue processing remain jobs, to avoid test warning:
    // "This usually means that there are asynchronous operations that weren't stopped in your tests. Consider running Jest with `--detectOpenHandles` to troubleshoot this issue."
    // It's better to wait for all expiredJobQueue jobs done.
    await sleep(350);
    done();
  });
});

it('should activate expiredJobQueue after jobQueue drained', (done) => {
  const expiredJobData = jobData.expiredTextMessage;
  const activeJobData = jobData.textMessage;

  processGroupEvent
    .mockImplementationOnce(async () => {
      await sleep(100);
      return Promise.resolve({
        replyToken: activeJobData.replyToken,
        result: {
          replies: { text: 'it`s rumor.' },
        },
      });
    })
    .mockImplementationOnce(async () => {
      await sleep(100);
      return Promise.reject(
        new TimeoutError('mock processGroupEvent timeout error')
      );
    });

  expiredJobQueue.pause();
  expiredJobQueue.add(expiredJobData, { jobId: 'testExpiredId1' });

  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(activeJobData, { jobId: 'successJobId' });

  jobQueue.on('active', async () => {
    expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
      Object {
        "active": 0,
        "completed": 0,
        "delayed": 0,
        "failed": 0,
        "paused": 1,
        "waiting": 0,
      }
    `);
  });

  jobQueue.on('drained', async () => {
    // delay for expiredJobQueue to become active
    await sleep(100);
    expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
      Object {
        "active": 1,
        "completed": 0,
        "delayed": 0,
        "failed": 0,
        "paused": 0,
        "waiting": 0,
      }
    `);
  });

  expiredJobQueue.on('drained', async () => {
    expect(processGroupEvent).toHaveBeenCalledTimes(2);
    expect(await jobQueue.getJobCounts()).toMatchInlineSnapshot(`
      Object {
        "active": 0,
        "completed": 1,
        "delayed": 0,
        "failed": 0,
        "paused": 0,
        "waiting": 0,
      }
    `);
    expect(await expiredJobQueue.getJobCounts()).toMatchInlineSnapshot(`
      Object {
        "active": 0,
        "completed": 0,
        "delayed": 0,
        "failed": 1,
        "paused": 0,
        "waiting": 0,
      }
    `);
    done();
  });
});

const getKeys = async (q) => {
  const multi = q.multi();
  multi.keys('*');
  const keys = await multi.exec();
  return keys[0][1];
};

const filterQueueKeys = (q, keys) => {
  const prefix = `${q.keyPrefix}:${q.name}`;
  return keys.filter((k) => k.includes(prefix));
};

const deleteKeys = async (q, keys) => {
  const multi = q.multi();
  keys.forEach((k) => multi.del(k));
  await multi.exec();
};

/**
 * https://github.com/OptimalBits/bull/issues/709
 *
 * Clean all history in queue ('completed' | 'wait' | 'active' | 'delayed' | 'failed' | 'paused')
 *
 * @param {Bull.Queue} q
 */
const emptyQueue = async (q) => {
  const keys = await getKeys(q);
  const queueKeys = filterQueueKeys(q, keys);
  await deleteKeys(q, queueKeys);
};

/**
 *
 * @param {Bull.Queue} q
 * @return {boolean}
 */
const isQueueIdle = async (q) => {
  return (
    await Promise.all([
      q.getPausedCount(),
      q.getActiveCount(),
      q.getWaitingCount(),
    ])
  ).reduce((acc, v) => {
    return (acc = v === 0 && acc);
  }, true);
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
