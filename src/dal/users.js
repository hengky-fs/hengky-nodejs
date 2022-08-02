const { Cruds } = require('./BaseClasses');
const {
  users,
  internalTransfers,
  brokerPaymentMethods,
  notifications,
} = require('../models');

class User extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.hasMany(internalTransfers, {
      foreignKey: 'userId',
      sourceKey: 'userId',
    });
    this.Model.hasMany(brokerPaymentMethods, {
      foreignKey: 'userId',
      sourceKey: 'userId',
    });
    this.Model.hasMany(notifications, {
      foreignKey: 'userId',
      sourceKey: 'userId',
    });
  }
}
module.exports = new User(users);
