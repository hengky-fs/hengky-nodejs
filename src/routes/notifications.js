const express = require('express');
const { NotificationController } = require('../controller');

const notificationRouter = express.Router();

notificationRouter.get('/countUnreadNotification/:userId', NotificationController.countUnreadNotification);
notificationRouter.get('/:userId', NotificationController.getNotifications);
notificationRouter.get('/:userId/:id', NotificationController.getNotificationsById);
notificationRouter.post('/markAllAsRead/:userId', NotificationController.markAllAsRead);
notificationRouter.put('/markAsRead/:userId/:id', NotificationController.markAsRead);

module.exports = notificationRouter;
