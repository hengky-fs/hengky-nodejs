const { Cruds } = require('./BaseClasses');
const {
  notificationTemplates,
} = require('../models');

class NotificationTemplate extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
  }
}
module.exports = new NotificationTemplate(notificationTemplates);
