const express = require('express');

const { responseHandler } = require('../utils/response');
const { AdminService } = require('../service');
const { AdminController } = require('../controller');
const { validationMiddleware } = require('../middleware');
const { AdminValidation } = require('../validations');
const validateOrderNumberFormat = require('../middleware/validateOrderNumberFormat');
const CustomError = require('../utils/error');

const adminRouter = express.Router();
const isSuccess = true;

// PAYMENT METHOD (BANK TYPES)
adminRouter.get(`/bankTypes`, AdminController.getBankTypes);
adminRouter.get(`/bankTypes/:id`, AdminController.getBankTypesById);
adminRouter.post(`/bankTypes`, validationMiddleware(AdminValidation.createBankTypes), AdminController.createBankTypes);
adminRouter.put(`/bankTypes/:id`, validationMiddleware(AdminValidation.updateBankTypes), AdminController.updateBankTypes);

// PAYMENT METHOD (BANKS)
adminRouter.get(`/banks`, AdminController.getBanks);
adminRouter.get(`/banks/:id`, AdminController.getBanksById);
adminRouter.post(`/banks`, validationMiddleware(AdminValidation.createBanks), AdminController.createBanks);
adminRouter.put(`/banks/:id`, validationMiddleware(AdminValidation.updateBanks), AdminController.updateBanks);

// DISPUTE REASONS
adminRouter.get('/disputeReasons', AdminController.getDisputeReasons);
adminRouter.get('/disputeReasons/:id', AdminController.getDisputeReasonsById);
adminRouter.post('/disputeReasons', validationMiddleware(AdminValidation.createDisputeReasons), AdminController.createDisputeReasons);
adminRouter.put('/disputeReasons/:id', validationMiddleware(AdminValidation.updateDisputeReasons), AdminController.updateDisputeReasons);

// LISTINGS
adminRouter.get(`/listings`, AdminController.getListings);
adminRouter.get(`/listings/:id`, AdminController.getListingsById);

// ORDERS
adminRouter.get(`/orders`, AdminController.getOrders);
adminRouter.get(`/orders/:orderNumber`, AdminController.getOrdersByOrderNumber);

// DISPUTE ORDERS
adminRouter.get('/orderDisputes', async (request, response, next) => {
  try {
    responseHandler({
      response,
      result: await AdminService.getDisputeOrders(request.query),
      isSuccess,
    });
  } catch (error) {
    next(error);
  }
});
adminRouter.put('/orderDisputes/:orderNumber', validationMiddleware(AdminValidation.updateDisputeOrders),
  async (request, response, next) => {
    try {
      const { orderNumber } = request.params;
      const { adminId, status, notes } = request.body;

      responseHandler({
        response,
        result: await AdminService.updateDisputeOrders({ orderNumber, status, adminId, notes }),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  });
adminRouter.put('/orderDisputes/:orderNumber/notes', validationMiddleware(AdminValidation.updateNotesDisputeOrders),
  async (request, response, next) => {
    try {
      const { orderNumber } = request.params;
      const { adminId, notes } = request.body;

      responseHandler({
        response,
        result: await AdminService.updateNotesDisputeOrders({ orderNumber, adminId, notes }),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  });
adminRouter.put('/orderDisputes/:orderNumber/changeAssigner', validationMiddleware(AdminValidation.orderDisputeChangeAssigner),
  async (request, response, next) => {
    try {
      const { orderNumber } = request.params;
      const { targetAdminId, adminId } = request.body;

      responseHandler({
        response,
        result: await AdminService.orderDisputeChangeAssigner({ orderNumber, targetAdminId, adminId }),
        isSuccess,
      });
    } catch (error) {
      next(error);
    }
  });
adminRouter.get('/orderDisputes/:orderNumber', validateOrderNumberFormat, async (request, response, next) => {
  try {
    const { total, orders } = await AdminService.getDisputeOrders({
      orderNumber: request.params.orderNumber
    });
    if (!total) {
      throw new CustomError({ code: 404, message: 'Not Found' });
    }
    const orderDispute = orders[0];
    responseHandler({
      response,
      result: orderDispute,
    });
  } catch (error) {
    next(error);
  }
});

// REPORT
adminRouter.get(`/getListingReport`, AdminController.getListingReport);
adminRouter.get(`/getKycReport`, AdminController.getKycReport);
adminRouter.get(`/getEscrowReport`, AdminController.getEscrowReport);
adminRouter.get(`/getFiatTransactionReport`, AdminController.getFiatTransactionReport);
adminRouter.get(`/getReportOrder`, AdminController.getReportOrder);
adminRouter.get('/getUsers', async (request, response, next) => {
  try {
    responseHandler({
      response,
      result: await AdminService.getUsers(),
      isSuccess,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = adminRouter;
