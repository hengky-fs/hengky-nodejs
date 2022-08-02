const { Cruds } = require('./BaseClasses');
const { bankTypes, banks } = require('../models');

class BankType extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.hasMany(banks, {
      foreignKey: 'type',
      sourceKey: 'id',
    });
  }
}
module.exports = new BankType(bankTypes);
