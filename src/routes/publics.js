const express = require('express');
const { PublicController } = require('../controller');

const publicRouter = express.Router();

publicRouter.get('/banks', PublicController.getBanks);
publicRouter.get('/currencies', PublicController.getCurrencies);
publicRouter.get('/getCoinPrices', PublicController.getCoinPrices);
publicRouter.get('/pmButtons', PublicController.getPmButtons);

module.exports = publicRouter;
