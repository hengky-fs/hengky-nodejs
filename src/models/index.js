const Sequelize = require('sequelize');
const sequelize = require('../common/sequelize');

const listings = require('./listings')(sequelize, Sequelize);
const brokerPaymentMethods = require('./brokerPaymentMethods')(sequelize, Sequelize);
const banks = require('./banks')(sequelize, Sequelize);
const bankTypes = require('./bankTypes')(sequelize, Sequelize);
const orders = require('./orders')(sequelize, Sequelize);
const feedbacks = require('./feedbacks')(sequelize, Sequelize);
const notifications = require('./notifications')(sequelize, Sequelize);
const notificationTemplates = require('./notificationTemplates')(sequelize, Sequelize);
const disputeReasons = require('./disputeReasons')(sequelize, Sequelize);
const orderDisputes = require('./orderDisputes')(sequelize, Sequelize);
const orderTimes = require('./orderTimes')(sequelize, Sequelize);
const users = require('./users')(sequelize, Sequelize);
const internalTransfers = require('./internalTransfers')(sequelize, Sequelize);
const orderTransfers = require('./orderTransfers')(sequelize, Sequelize);

const db = {
  sequelize,
  listings,
  brokerPaymentMethods,
  banks,
  bankTypes,
  orders,
  feedbacks,
  notifications,
  notificationTemplates,
  disputeReasons,
  orderDisputes,
  orderTimes,
  users,
  internalTransfers,
  orderTransfers,
};

db.sequelize = sequelize;
module.exports = db;
