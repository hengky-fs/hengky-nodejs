const {
  BrokerService,
  UserSubAccountService,
} = require('../service');
const { responseHandler } = require('../utils/response');

class BrokerController {
  static async getProfile(req, res, next) {
    try {
      const result = await BrokerService.getProfile(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFeedbacks(req, res, next) {
    try {
      const result = await BrokerService.getFeedbacks(req.params, req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBalances(req, res, next) {
    try {
      const { userId, coin } = req.params;
      const result = await UserSubAccountService.getBalances(userId, null, coin);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async internalTransfer(req, res, next) {
    try {
      const result = await BrokerService.internalTransfer(req.params, req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  // BROKERS

  static async getMyPaymentMethod(req, res, next) {
    try {
      const result = await BrokerService.getMyPaymentMethod(req.params, req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyPaymentMethodById(req, res, next) {
    try {
      const result = await BrokerService.getMyPaymentMethodById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMyPaymentMethod(req, res, next) {
    try {
      const result = await BrokerService.createMyPaymentMethod(req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyPaymentMethod(req, res, next) {
    try {
      const result = await BrokerService.updateMyPaymentMethod(req.params, req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async activeInActiveMyPaymentMethod(req, res, next) {
    try {
      const result = await BrokerService.activeInActiveMyPaymentMethod(req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }
}
module.exports = BrokerController;
