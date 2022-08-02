const express = require('express');

const config = require('../common/config');
const statusRouter = require('./status');
const listingRouter = require('./listings');
const brokerRouter = require('./brokers');
const orderRouter = require('./orders');
const publicRouter = require('./publics');
const adminRouter = require('./admins');
const notificationRouter = require('./notifications');

const router = express.Router();

const setRouter = (app) => {
  router.use(`/${config.apiVersion}/status`, statusRouter);
  router.use(`/${config.apiVersion}/admins`, adminRouter);
  router.use(`/${config.apiVersion}/listings`, listingRouter);
  router.use(`/${config.apiVersion}/brokers`, brokerRouter);
  router.use(`/${config.apiVersion}/orders`, orderRouter);
  router.use(`/${config.apiVersion}/publics`, publicRouter);
  router.use(`/${config.apiVersion}/notifications`, notificationRouter);

  app.use('/api', router);
  app.get('/status', (req, res) => res.send('OK'));
};

module.exports = { setRouter };
