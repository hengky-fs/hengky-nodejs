const { PublicService } = require('../service');
const { responseHandler } = require('../utils/response');

class PublicController {
  static async getBanks(req, res, next) {
    try {
      const result = await PublicService.getBanks();

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCurrencies(req, res, next) {
    try {
      const result = await PublicService.getCurrencies();

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCoinPrices(req, res, next) {
    try {
      const result = await PublicService.getCoinPrices();

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPmButtons(req, res, next) {
    try {
      const result = await PublicService.getPmButtons();

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
module.exports = PublicController;
