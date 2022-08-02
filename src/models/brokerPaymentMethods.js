module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'brokerPaymentMethods',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      bankId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      accountName: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      accountNumber: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      accountBeneficiary: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ibanNumber: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'brokerPaymentMethods',
      timestamps: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [
            { name: 'id' },
          ],
        },
      ],
    }
  );
};
