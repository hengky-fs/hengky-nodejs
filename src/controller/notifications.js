const { NotificationService } = require('../service');
const { responseHandler } = require('../utils/response');

class NotificationController {
  static async getNotifications(req, res, next) {
    try {
      const result = await NotificationService.getNotifications(req.params, req.query);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getNotificationsById(req, res, next) {
    try {
      const result = await NotificationService.getNotificationsById(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async countUnreadNotification(req, res, next) {
    try {
      const result = await NotificationService.countUnreadNotification(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAllAsRead(req.params);

      return responseHandler({
        response: res,
        result,
        isSuccess: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(req, res, next) {
    try {
      const result = await NotificationService.markAsRead(req.params);

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
module.exports = NotificationController;
