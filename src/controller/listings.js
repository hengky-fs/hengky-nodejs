const { ListingService } = require('../service');
const { responseHandler } = require('../utils/response');

class ListingController {
  static async getListing(req, res, next) {
    try {
      const result = await ListingService.getListing(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getListingById(req, res, next) {
    try {
      const result = await ListingService.getListingById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async highestLowestPrice(req, res, next) {
    try {
      const result = await ListingService.highestLowestPrice(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyListing(req, res, next) {
    try {
      const result = await ListingService.getMyListing(req.params, req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMyListingById(req, res, next) {
    try {
      const result = await ListingService.getMyListingById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createMyListing(req, res, next) {
    try {
      const result = await ListingService.createMyListing(req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMyListing(req, res, next) {
    try {
      const result = await ListingService.updateMyListing(req.params, req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async activeInActiveMyListing(req, res, next) {
    try {
      const result = await ListingService.activeInActiveMyListing(req.body);

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
module.exports = ListingController;
