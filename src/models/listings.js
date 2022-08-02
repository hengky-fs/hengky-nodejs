module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'listings',
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
      brokerType: {
        type: DataTypes.ENUM('BUY', 'SELL'),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('BUY', 'SELL'),
        allowNull: false,
      },
      coin: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '',
      },
      price: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      amount: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      minLimit: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      maxLimit: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      minLimitFiat: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      maxLimitFiat: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      floatingPricePercentage: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      paymentWindow: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isUsingBankTransfer: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isUsingDigitalWallet: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'listings',
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
