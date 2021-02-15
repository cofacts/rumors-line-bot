// spec: https://github.com/cofacts/rumors-line-bot/issues/13

// eslint-disable-next-line no-unused-vars
import Bull from 'bull';
import { TimeoutError, isEventExpired } from './utils';
import lineClient from 'src/webhook/lineClient';
import processGroupEvent from './processGroupEvent';
import rollbar from 'src/lib/rollbar';

export default class {
  /**
   *  expired queue start only when there's no jobs in jobQueue
   *  expired queue pause when there's jobs in jobQueue
   *
   * @param {Bull.Queue} jobQueue
   * @param {Bull.Queue} expiredJobQueue
   * @returns {object}
   */
  constructor(
    jobQueue,
    expiredJobQueue,
    concurrency = process.env.JOBQUEUE_CONCURRENCY || 3
  ) {
    this.expiredJobQueue = expiredJobQueue;
    this.jobQueue = jobQueue;

    this.jobQueue.process(concurrency, processJob.bind(this));
    // resolve
    this.jobQueue.on('completed', onCompleted);
    // reject
    this.jobQueue.on('failed', onFailed);
    // jobQueue completed the job and no other job processing
    this.jobQueue.on('drained', onDrained.bind(this));
    this.jobQueue.on('error', onError);

    this.expiredJobQueue.process(concurrency, processExpiredJob);

    async function processJob(job) {
      // console.log('Executing job ' + job.id);

      if (!(await this.expiredJobQueue.isPaused())) {
        this.expiredJobQueue.pause();
      }

      // Check if event is expired before processing.
      // Check and exit here because currently we cannot
      // kill or stop a running job outside the jobFunction.
      // see https://github.com/OptimalBits/bull/issues/1950
      if (isEventExpired(job.data.otherFields.timestamp)) {
        // move job to expired queue and exit
        this.expiredJobQueue.add(job.data, { jobId: job.id });
        return Promise.reject(new TimeoutError('Event expired'));
      }
      return processGroupEvent(job.data);
    }

    async function onCompleted(job, output) {
      // console.log('group message completed, job ' + job.id);
      const { result, replyToken } = output;

      if (result.replies) {
        // Send replies. Does not need to wait for lineClient's callbacks.
        // lineClient's callback does error handling by itself.
        //
        lineClient.post('/message/reply', {
          replyToken,
          messages: result.replies,
        });

        // eslint-disable-next-line no-unused-vars
        console.log('--------------------');
        // LOGGING:
        // 60 chars per line, each prepended with ||LOG||
        //
        console.log('\n||LOG||<----------');
        JSON.stringify({
          INPUT: job.data,
          OUTPUT: result.replies,
        })
          .split(/(.{60})/)
          .forEach(line => {
            if (line) {
              // Leading \n makes sure ||LOG|| is in the first line
              console.log(`\n||LOG||${line}`);
            }
          });
        console.log('\n||LOG||---------->');
      }
    }

    async function onDrained() {
      if (
        (await this.expiredJobQueue.isPaused()) &&
        (await this.expiredJobQueue.getWaitingCount()) > 0
      ) {
        this.expiredJobQueue.resume();
      }
    }

    async function onFailed(job, e) {
      // console.log('Fail jobQueue ' + e);
      if (!(e instanceof TimeoutError)) {
        console.error(e);
        rollbar.error(e, job.data);
      }
    }

    async function onError(e) {
      console.error(e);
      rollbar.error(e);
    }

    async function processExpiredJob(job) {
      // console.log('Executing expired job ' + job.id);
      return processGroupEvent(job.data);
    }
  }

  // public function
  async addJob(data, opt = {}) {
    // console.log('addJob data ' + JSON.stringify(data));
    return this.jobQueue.add(data, opt);
  }
}
