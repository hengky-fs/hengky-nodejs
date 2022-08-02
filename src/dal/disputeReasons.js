const { Cruds } = require('./BaseClasses');
const { disputeReasons } = require('../models');

class DisputeReason extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
  }
}
module.exports = new DisputeReason(disputeReasons);
