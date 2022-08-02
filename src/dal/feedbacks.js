const { Cruds } = require('./BaseClasses');
const { feedbacks, orders, banks } = require('../models');

class Feedback extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.belongsTo(orders, {
      as: 'feedback',
      foreignKey: 'orderNumber',
      targetKey: 'orderNumber',
    });
    this.Model.belongsTo(banks, {
      as: 'bank',
      foreignKey: 'bankId',
      targetKey: 'id',
    });
  }
}
module.exports = new Feedback(feedbacks);
