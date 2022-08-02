'use strict';

const table = 'listings';
module.exports = {
  async up (queryInterface, { DataTypes }) {
    const type = {
      type: DataTypes.STRING(255),
      allowNull: true,
    };
    await queryInterface.changeColumn(table, 'price', type);
    await queryInterface.changeColumn(table, 'minLimitFiat', type);
    await queryInterface.changeColumn(table, 'maxLimitFiat', type);
    await queryInterface.addColumn(table, 'floatingPricePercentage', type);
  },

  async down (queryInterface, { DataTypes }) {
    const type = {
      type: DataTypes.STRING(255),
      allowNull: false,
    };
    await queryInterface.changeColumn(table, 'price', type);
    await queryInterface.changeColumn(table, 'minLimitFiat', type);
    await queryInterface.changeColumn(table, 'maxLimitFiat', type);
    await queryInterface.removeColumn(table, 'floatingPricePercentage');
  }
};
