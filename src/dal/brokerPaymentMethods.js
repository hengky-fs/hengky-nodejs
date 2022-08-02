const { Cruds } = require('./BaseClasses');
const {
  brokerPaymentMethods,
  banks,
  orders,
  users,
} = require('../models');

class BrokerPaymentMethod extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(banks, {
      as: 'bank',
      foreignKey: 'bankId',
      targetKey: 'id',
    });
    this.Model.belongsTo(users, {
      as: 'user',
      foreignKey: 'userId',
      targetKey: 'userId',
    });
    this.Model.hasMany(orders, {
      foreignKey: 'paymentMethod',
      sourceKey: 'id',
    });
  }
}
module.exports = new BrokerPaymentMethod(brokerPaymentMethods);
