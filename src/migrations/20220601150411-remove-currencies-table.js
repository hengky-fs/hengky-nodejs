'use strict';

module.exports = {
  async up (queryInterface, { DataTypes }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable('currencies', { transaction });
      await queryInterface.removeColumn('listings', 'currencyId', { transaction });
      await queryInterface.addColumn('listings', 'currency', {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '',
      }, { transaction });
      await queryInterface.removeColumn('orders', 'currencyId', { transaction });
      await queryInterface.addColumn('orders', 'currency', {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '',
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('ERROR: ', error);
    }
  },

  async down (queryInterface, { DataTypes }) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        'currencies',
        {
          id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
          },
          code: {
            type: DataTypes.STRING(5),
            allowNull: false,
          },
          symbol: {
            type: DataTypes.STRING(10),
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
          transaction,
        },
      );
      await queryInterface.removeColumn('listings', 'currency', { transaction });
      await queryInterface.addColumn('listings', 'currencyId', {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      }, { transaction });
      await queryInterface.removeColumn('orders', 'currency', { transaction });
      await queryInterface.addColumn('orders', 'currencyId', {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('ERROR: ', error);
    }
  }
};
