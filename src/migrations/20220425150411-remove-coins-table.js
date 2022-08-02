'use strict';

module.exports = {
  async up (queryInterface) {
    await queryInterface.dropTable('coins');
  },

  async down (queryInterface, { DataTypes }) {
    await queryInterface.createTable(
      'coins',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        code: {
          type: DataTypes.STRING(10),
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(50),
          allowNull: false,
        },
        isActive: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        createdAt: {
          type: DataTypes.DATE(6),
          allowNull: false,
        },
        updatedAt: {
          type: DataTypes.DATE(6),
          allowNull: false,
        },
      },
      {
        charset: 'utf8',
      },
    );
  }
};
