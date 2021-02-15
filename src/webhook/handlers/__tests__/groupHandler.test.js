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
  emptyQueue(jobQueue);
  emptyQueue(expiredJobQueue);
  await jobQueue.close();
  await expiredJobQueue.close();
});

beforeAll(async () => {
  MockDate.set(1462629480000);
});

afterAll(async () => {
  MockDate.reset();
});

it('should not reply if result.replies undefined', done => {
  const { type, replyToken, ...otherFields } = jobData.joinGroup;
  const param = {
    replyToken,
    type,
    groupId: otherFields.source.groupId,
    otherFields: { ...otherFields },
  };
  processGroupEvent.mockImplementationOnce(() => ({
    replyToken,
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

it('should reply', done => {
  const jobId = 'testId';
  const { type, replyToken, ...otherFields } = jobData.textMessage;
  const param = {
    replyToken,
    type,
    groupId: otherFields.source.groupId,
    otherFields: { ...otherFields },
  };
  processGroupEvent.mockImplementationOnce(() => ({
    replyToken,
    result: {
      replies: { dd: 'a' },
    },
  }));
  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(param, { jobId });

  // Listen jobQueue.on('completed'),
  // this will run after gh.onCompleted
  // so we can test if the result of gh.onCompleted is correct
  jobQueue.on('completed', async job => {
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

it('should jobQueue failed with TimeoutError and should not add job to expiredQueue', done => {
  const jobId = 'testId';
  const { type, replyToken, ...otherFields } = jobData.textMessage;
  const param = {
    replyToken,
    type,
    groupId: otherFields.source.groupId,
    otherFields: { ...otherFields },
  };
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

it('should jobQueue failed with TimeoutError and add job to expiredQueue', done => {
  const jobId = 'testId';
  const { type, replyToken, ...otherFields } = jobData.expiredTextMessage;
  const param = {
    replyToken,
    type,
    groupId: otherFields.source.groupId,
    otherFields: { ...otherFields },
  };
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

  // in real case this will not happen
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

it('should pause expired job queue when there are events comming in', done => {
  let failedCount = 0;
  let drainedCount = 0;
  let successCount = 0;
  let expiredQueuePausedTimes = 0;
  let expiredActiveCount = 0;
  // event timestamp affects job queue
  const { type, replyToken, ...otherFields } = jobData.expiredTextMessage;
  const param = {
    replyToken,
    type,
    groupId: otherFields.source.groupId,
    otherFields: { ...otherFields },
  };

  processGroupEvent.mockImplementation(async () => {
    await sleep(100);
    // console.log('processGroupEvent failed with timeout');
    return Promise.reject(
      new TimeoutError('mock processGroupEvent timeout error')
    );
  });
  const gh = new GroupHandler(jobQueue, expiredJobQueue, 1);
  gh.addJob(param, { jobId: 'testExpiredId1' });
  gh.addJob(param, { jobId: 'testExpiredId2' });
  gh.addJob(param, { jobId: 'testExpiredId3' });
  gh.addJob(param, { jobId: 'testExpiredId4' });

  // add a job while expiredJobQueue active
  expiredJobQueue.on('active', () => {
    // console.log('expiredJobQueue active ' + expiredActiveCount);
    if (expiredActiveCount++ === 1) {
      const { type, replyToken, ...otherFields } = jobData.textMessage;
      const param = {
        replyToken,
        type,
        groupId: otherFields.source.groupId,
        otherFields: { ...otherFields },
      };
      gh.addJob(param, { jobId: 'successJobId' });

      // To make sure this event will success(completed),
      // mockImplementation to resolve a valid result.
      //
      // Note: this may make some expired job success(completed),
      // but in real case it will not happen. And because we do
      // nothing on expired job `completed`, make some expired job
      // success won't affect the test result.
      processGroupEvent.mockImplementation(async () => {
        await sleep(100);
        // console.log('processGroupEvent success');
        return Promise.resolve({
          replyToken,
          result: {
            replies: { text: 'it`s rumor.' },
          },
        });
      });
    }
  });

  jobQueue.on('completed', async () => {
    // console.log('jobQueue.completed');
    successCount++;
    // mockImplementation back to reject by timeout
    processGroupEvent.mockImplementation(async () => {
      await sleep(100);
      // console.log('processGroupEvent failed with timeout');
      return Promise.reject(
        new TimeoutError('mock processGroupEvent timeout error')
      );
    });
  });
  jobQueue.on('failed', async () => {
    // console.log('jobQueue.failed done');
    failedCount++;
  });
  expiredJobQueue.on('paused', async () => {
    expiredQueuePausedTimes++;
  });

  jobQueue.on('drained', async () => {
    // console.log('jobQueue drained');
    drainedCount++;
  });

  expiredJobQueue.on('drained', async () => {
    // console.log('expiredJobQueue drained');
    if ((await isQueueIdle(jobQueue)) && (await isQueueIdle(expiredJobQueue))) {
      // console.log('test done');

      // one by jobQueue, four by expiredJobQueue
      expect(processGroupEvent).toHaveBeenCalledTimes(5);

      // jobQueue
      //
      // console.log('success: ' + successCount + ', failed: ' + failedCount);

      // should have one job(`successJobId`) success
      expect(successCount).toBe(1);
      expect(lineClient.post).toHaveBeenCalledTimes(successCount);
      // jobQueue should drained twice
      // first time is by `testExpiredId`s, second time is by `successJobId`
      expect(drainedCount).toBe(2);
      expect(await jobQueue.getJobCounts()).toMatchInlineSnapshot(`
        Object {
          "active": 0,
          "completed": 1,
          "delayed": 0,
          "failed": 4,
          "paused": 0,
          "waiting": 0,
        }
      `);

      // expiredJobQueue
      //
      // it should have four job failed with timeout and process by expiredJobQueue
      const expiredJobCount = await getJobCounts(expiredJobQueue);
      expect(failedCount).toBe(expiredJobCount);
      expect(expiredJobCount).toBe(4);
      // expiredQueue should pause two times:
      // first time by testExpiredId1, second time by testId
      expect(expiredQueuePausedTimes).toBe(2);

      done();
    }
  });
});

const getKeys = async q => {
  const multi = q.multi();
  multi.keys('*');
  const keys = await multi.exec();
  return keys[0][1];
};

const filterQueueKeys = (q, keys) => {
  const prefix = `${q.keyPrefix}:${q.name}`;
  return keys.filter(k => k.includes(prefix));
};

const deleteKeys = async (q, keys) => {
  const multi = q.multi();
  keys.forEach(k => multi.del(k));
  await multi.exec();
};

/**
 * https://github.com/OptimalBits/bull/issues/709
 *
 * Clean all history in queue ('completed' | 'wait' | 'active' | 'delayed' | 'failed' | 'paused')
 *
 * @param {Bull.Queue} q
 */
const emptyQueue = async q => {
  const keys = await getKeys(q);
  const queueKeys = filterQueueKeys(q, keys);
  await deleteKeys(q, queueKeys);
};

/**
 *
 * @param {Bull.Queue} q
 * @return {boolean}
 */
const isQueueIdle = async q => {
  return (await Promise.all([
    q.getPausedCount(),
    q.getActiveCount(),
    q.getWaitingCount(),
  ])).reduce((acc, v) => {
    return (acc = v === 0 && acc);
  }, true);
};

/**
 *
 * @param {Bull.Queue} q
 * @return {number}
 */
const getJobCounts = async q => {
  const jobCount = await q.getJobCounts();
  // console.log(JSON.stringify(jobCount));
  return Object.values(jobCount).reduce((acc, v) => acc + v, 0);
};

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
