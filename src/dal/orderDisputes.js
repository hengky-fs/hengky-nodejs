const { Cruds } = require('./BaseClasses');
const {
  orderDisputes,
  orders,
  orderTimes,
} = require('../models');

class OrderDispute extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(orders, {
      as: 'order',
      foreignKey: 'orderNumber',
      targetKey: 'orderNumber',
    });
    this.Model.belongsTo(orderTimes, {
      as: 'orderTime',
      foreignKey: 'orderNumber',
      targetKey: 'orderNumber',
    });
  }
}

module.exports = new OrderDispute(orderDisputes);
