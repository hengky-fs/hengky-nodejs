const sequelize = require('../common/sequelize');
const { CustomError } = require('../utils');

const {
  notificationsDal,
} = require('../dal');

class NotificationService {
  static async getNotifications({ userId }, { page, limit }) {
    const total = await notificationsDal.count({ where: { userId } });
    const { count: filtered, rows: notifications } = await notificationsDal.findAndCountAll(
      { where: { userId }},
      page,
      limit,
    );

    return { total, filtered, notifications };
  }

  static async getNotificationsById({ userId, id }) {
    await this.markAsRead({ userId, id });
    return notificationsDal.findOne({ userId, id });
  }

  static async countUnreadNotification({userId}) {
    return notificationsDal.count({ where: { userId, isRead: false } });
  }

  static async markAllAsRead({ userId }) {
    const transaction = await sequelize.transaction();
    try {
      await notificationsDal.update(
        { userId, isRead: false },
        { isRead: true },
        { transaction }
      );
      await transaction.commit();
      return 'Success mark all as read!'
    } catch (err) {
      await transaction.rollback();
      throw new CustomError(err);
    }
  }

  static async markAsRead({ userId, id }) {
    await notificationsDal.update(
      { userId, id },
      { isRead: true },
    );
    return 'Success mark as read!'
  }
}
module.exports = NotificationService;
