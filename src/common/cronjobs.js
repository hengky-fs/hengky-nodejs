const cron = require('node-cron');

const Utils  = require('./utils');
const { OrderService }  = require('../service');
const { logger, config } = require('./index');

const isCronScheduled = config.activateCronJob ? JSON.parse(config.activateCronJob) : false;
const cronScheduled = { scheduled: isCronScheduled };
const cronMessage = (message = '') => {
  logger.info(`===== ${message} =====`);
};

const crons = () => {
  cron.schedule(config.cronSchedule.autoExpiredOrder, async () => {
    cronMessage('Cron job is running for Expired Orders!');
    await OrderService.expiredOrder();
  }, cronScheduled);

  cron.schedule(config.cronSchedule.autoDisputedOrder, async () => {
    cronMessage('Cron job is running for Dispute Orders!');
    await OrderService.autoDisputedOrder();
  }, cronScheduled);

  cron.schedule(config.cronSchedule.autoUpdateCryptoTickerPrice, async () => {
    cronMessage('Cron job is running for Update Crypto Ticker Price!');
    await Utils.fetchCryptoTickerPrice();
  }, cronScheduled);

  cron.schedule(config.cronSchedule.autoUpdateFiatPairing, async () => {
    cronMessage('Cron job is running for Update Fiat Pairing!');
    await Utils.fetchFiatPairing();
  }, cronScheduled);
};

module.exports = crons;