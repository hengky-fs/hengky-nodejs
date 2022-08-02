const { Cruds } = require('./BaseClasses');
const {
  orders,
  orderTimes,
  feedbacks,
  brokerPaymentMethods,
  listings,
  orderTransfers,
  orderDisputes,
} = require('../models');

class Order extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.hasOne(orderTimes, {
      foreignKey: 'orderNumber',
      sourceKey: 'orderNumber',
    });
    this.Model.hasOne(orderTransfers, {
      foreignKey: 'orderNumber',
      sourceKey: 'orderNumber',
    });
    this.Model.hasOne(orderDisputes, {
      foreignKey: 'orderNumber',
      sourceKey: 'orderNumber',
    });
    this.Model.hasMany(feedbacks, {
      foreignKey: 'orderNumber',
      sourceKey: 'orderNumber',
    });
    this.Model.belongsTo(brokerPaymentMethods, {
      as: 'paymentMethods',
      foreignKey: 'paymentMethod',
      targetKey: 'id',
    });
    this.Model.belongsTo(listings, {
      as: 'listing',
      foreignKey: 'listingId',
      targetKey: 'id',
    });
  }
}
module.exports = new Order(orders);
