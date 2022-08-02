const express = require('express');

const { BrokerController } = require('../controller');
const { validationMiddleware } = require('../middleware');
const { BrokerValidation } = require('../validations');

const brokerRouter = express.Router();
const pm = '/paymentMethods'

// USERS
brokerRouter.get(`/profile/:userId`, BrokerController.getProfile);
brokerRouter.get(`/feedbacks/:userId`, BrokerController.getFeedbacks);
brokerRouter.get('/getBalances/:userId', BrokerController.getBalances);
brokerRouter.get('/getBalances/:userId/:coin', BrokerController.getBalances);
brokerRouter.post('/internalTransfer/:userId', validationMiddleware(BrokerValidation.internalTransfer), BrokerController.internalTransfer);

// BROKERS
brokerRouter.get(`${pm}/:userId`, BrokerController.getMyPaymentMethod);
brokerRouter.get(`${pm}/:userId/:id`, BrokerController.getMyPaymentMethodById);
brokerRouter.post(
  `${pm}/`,
  validationMiddleware(BrokerValidation.createMyPaymentMethod),
  BrokerController.createMyPaymentMethod
);
brokerRouter.put(
  `${pm}/update/:userId/:id`,
  validationMiddleware(BrokerValidation.updateMyPaymentMethod),
  BrokerController.updateMyPaymentMethod
);
brokerRouter.put(
  `${pm}/status`,
  validationMiddleware(BrokerValidation.activeInActiveMyPaymentMethod),
  BrokerController.activeInActiveMyPaymentMethod
);

module.exports = brokerRouter;
