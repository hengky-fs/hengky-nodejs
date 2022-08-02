const { Cruds } = require('./BaseClasses');
const {
  internalTransfers,
  users,
} = require('../models');

class InternalTransfer extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(users, {
      as: 'user',
      foreignKey: 'userId',
      targetKey: 'userId',
    });
  }
}
module.exports = new InternalTransfer(internalTransfers);
