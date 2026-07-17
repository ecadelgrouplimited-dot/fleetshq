const cron = require('node-cron');
const { runAlertJob } = require('../services/alert.service');
const { runSubscriptionLifecycle } = require('../services/subscriptionLifecycle.service');
const logger = require('../utils/logger');

const SCHEDULE = process.env.CRON_DAILY_ALERTS || '0 6 * * *';
const BILLING_SCHEDULE = process.env.CRON_BILLING_LIFECYCLE || '0 7 * * *';

const scheduleJobs = () => {
  cron.schedule(SCHEDULE, async () => {
    logger.info('Daily alert job triggered by cron');
    await runAlertJob();
  }, { timezone: 'UTC' });

  cron.schedule(BILLING_SCHEDULE, async () => {
    logger.info('Subscription lifecycle job triggered by cron');
    try { await runSubscriptionLifecycle(); } catch (e) { logger.error('Subscription lifecycle job failed:', e); }
  }, { timezone: 'UTC' });

  logger.info(`Daily alert job scheduled: ${SCHEDULE}; billing lifecycle: ${BILLING_SCHEDULE}`);
};

module.exports = { scheduleJobs };
