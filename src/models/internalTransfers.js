module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'internalTransfers',
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
      from: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      to: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      txnId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      clientTranId: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      coin: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      amount: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'PROCESSED',
      },
    },
    {
      sequelize,
      tableName: 'internalTransfers',
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