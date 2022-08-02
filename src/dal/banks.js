const { Cruds } = require('./BaseClasses');
const {
  banks,
  bankTypes,
  brokerPaymentMethods,
  feedbacks,
} = require('../models');

class Bank extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(bankTypes, {
      as: 'bankType',
      foreignKey: 'type',
      targetKey: 'id',
    });
    this.Model.hasMany(brokerPaymentMethods, {
      foreignKey: 'bankId',
      sourceKey: 'id',
    });
    this.Model.hasMany(feedbacks, {
      foreignKey: 'bankId',
      sourceKey: 'id',
    });
  }
}
module.exports = new Bank(banks);
