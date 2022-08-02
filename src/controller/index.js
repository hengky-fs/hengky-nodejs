const ListingController = require('./listings');
const BrokerController = require('./brokers');
const PublicController = require('./publics');
const AdminController = require('./admins');
const NotificationController = require('./notifications');

module.exports = {
  BrokerController,
  ListingController,
  PublicController,
  AdminController,
  NotificationController,
};
