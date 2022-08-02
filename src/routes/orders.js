const express = require('express');

const { responseHandler } = require('../utils/response');
const { validationMiddleware } = require('../middleware');
const { OrderService } = require('../service');
const { OrderValidation } = require('../validations');

const orderRouter = express.Router();
const isSuccess = true;

// GET Routes
orderRouter.get('/listStatus', async (request, response, next) => {
  try {
    responseHandler({
      response,
      result: await OrderService.listStatus(),
      isSuccess,
    });
  } catch (error) {
    next(error);
  }
});
orderRouter.get('/', async (request, response, next) => {
  try {
    responseHandler({
      response,
      result: await OrderService.getOrder(request.query),
      isSuccess,
    });
  } catch (error) {
    next(error);
  }
});
orderRouter.get('/:userId/:orderNumber', async (request, response, next) => {
  try {
    responseHandler({
      response,
      result: await OrderService.getOrderDetail(request.params, false),
      isSuccess,
    });
  } catch (error) {
    next(error);
  }
});
orderRouter.get('/hasFeedback/:orderNumber/:createdBy', async (request, response, next) => {
  try {
    responseHandler({
      response,
      result: await OrderService.hasFeedback(request.params),
      isSuccess,
    });
  } catch (error) {
    next(error);
  }
});

// POST Routes
orderRouter.post('/', validationMiddleware(OrderValidation.createOrder),
  async (request, response, next) => {
    try {
      responseHandler({
        response,
        result: await OrderService.createOrder(request.body),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  }
);
orderRouter.post('/feedback', validationMiddleware(OrderValidation.feedback),
  async (request, response, next) => {
    try {
      responseHandler({
        response,
        result: await OrderService.feedback(request.body),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  }
);
orderRouter.post('/generateOrderChatUrl', validationMiddleware(OrderValidation.generateOrderChatUrl),
  async (request, response, next) => {
    try {
      responseHandler({
        response,
        result: await OrderService.generateOrderChatUrl(request.body),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT Routes
orderRouter.put('/changeOrderStatus/:orderNumber', validationMiddleware(OrderValidation.changeOrderStatus),
  async (request, response, next) => {
    try {
      responseHandler({
        response,
        result: await OrderService.changeOrderStatus(request.params, request.body),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  }
);
orderRouter.put('/rejectCancelDispute/:orderNumber', validationMiddleware(OrderValidation.rejectCancelDispute),
  async (request, response, next) => {
    try {
      responseHandler({
        response,
        result: await OrderService.rejectCancelDispute(request.params, request.body),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = orderRouter;
