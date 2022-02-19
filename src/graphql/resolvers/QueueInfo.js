export default {
  queueName(queue) {
    return queue.name;
  },

  jobCounts(queue) {
    return queue.getJobCounts();
  },

  isPaused(queue) {
    return queue.isPaused();
  },

  async lastCompletedAt(queue) {
    // Latest job = 1st job
    const lastCompletedJobs = await queue.getCompleted(0, 0);
    if (!lastCompletedJobs || !lastCompletedJobs[0]) return null;
    return new Date(lastCompletedJobs[0].timestamp);
  },

  async lastWaitingAt(queue) {
    // Latest job = 1st job
    const lastCompletedJobs = await queue.getWaiting(0, 0);
    if (!lastCompletedJobs || !lastCompletedJobs[0]) return null;
    return new Date(lastCompletedJobs.timestamp);
  },
};
