const { Cruds } = require('./BaseClasses');
const {
  listings,
  orders,
} = require('../models');

class Listing extends Cruds {
  constructor(Model) {
    super(Model);
    this.Model = Model;
    this.associations();
  }

  associations() {
    this.Model.hasMany(orders, {
      foreignKey: 'listingId',
      sourceKey: 'id',
    });
  }
}
module.exports = new Listing(listings);
