const cron = require('node-cron');
const { runAlertJob } = require('../services/alert.service');
const logger = require('../utils/logger');

const SCHEDULE = process.env.CRON_DAILY_ALERTS || '0 6 * * *';

const scheduleJobs = () => {
  cron.schedule(SCHEDULE, async () => {
    logger.info('Daily alert job triggered by cron');
    await runAlertJob();
  }, { timezone: 'UTC' });

  logger.info(`Daily alert job scheduled: ${SCHEDULE}`);
};

module.exports = { scheduleJobs };
