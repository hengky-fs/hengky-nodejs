const { Cruds } = require('./BaseClasses');
const {
  orderTransfers,
  orders,
} = require('../models');

class OrderTransfers extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(orders, {
      as: 'orderTransfer',
      foreignKey: 'orderNumber',
      targetKey: 'orderNumber',
    });
  }
}
module.exports = new OrderTransfers(orderTransfers);
