const { Cruds } = require('./BaseClasses');
const {
  orders,
  orderTimes,
} = require('../models');

class OrderTime extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(orders, {
      as: 'orderTime',
      foreignKey: 'orderNumber',
      targetKey: 'orderNumber',
    });
  }
}
module.exports = new OrderTime(orderTimes);
