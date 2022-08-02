const { Cruds } = require('./BaseClasses');
const {
  notifications,
  users,
} = require('../models');

class Notification extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
  }

  associations() {
    this.Model.belongsTo(users, {
      as: 'user',
      foreignKey: 'userId',
      targetKey: 'userId',
    });
  }
}
module.exports = new Notification(notifications);
