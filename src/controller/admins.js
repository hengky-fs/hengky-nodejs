const {
  AdminService,
  ListingService,
  OrderService,
} = require('../service');
const { responseHandler } = require('../utils/response');

class AdminController {
  static async getBankTypes(req, res, next) {
    try {
      const result = await AdminService.getBankTypes(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBankTypesById(req, res, next) {
    try {
      const result = await AdminService.getBankTypesById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBankTypes(req, res, next) {
    try {
      const result = await AdminService.createBankTypes(req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBankTypes(req, res, next) {
    try {
      const result = await AdminService.updateBankTypes(req.params, req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBanks(req, res, next) {
    try {
      const result = await AdminService.getBanks(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getBanksById(req, res, next) {
    try {
      const result = await AdminService.getBanksById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createBanks(req, res, next) {
    try {
      const result = await AdminService.createBanks(req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateBanks(req, res, next) {
    try {
      const result = await AdminService.updateBanks(req.params, req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDisputeReasons(req, res, next) {
    try {
      const result = await AdminService.getDisputeReasons(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDisputeReasonsById(req, res, next) {
    try {
      const result = await AdminService.getDisputeReasonsById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async createDisputeReasons(req, res, next) {
    try {
      const result = await AdminService.createDisputeReasons(req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateDisputeReasons(req, res, next) {
    try {
      const result = await AdminService.updateDisputeReasons(req.params, req.body);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getListings(req, res, next) {
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

  static async getListingsById(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ListingService.detailListing({ listingId: id });

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrders(req, res, next) {
    try {
      const result = await OrderService.getOrder(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getOrdersByOrderNumber(req, res, next) {
    try {
      const result = await OrderService.getOrderDetail(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getListingReport(req, res, next) {
    try {
      const result = await AdminService.getListingReport(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getKycReport(req, res, next) {
    try {
      const result = await AdminService.getKycReport(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getEscrowReport(req, res, next) {
    try {
      const result = await AdminService.getEscrowReport(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getFiatTransactionReport(req, res, next) {
    try {
      const result = await AdminService.getFiatTransactionReport(req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReportOrder(req, res, next) {
    try {
      const result = await AdminService.getReportOrder(req.query);

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
module.exports = AdminController;
