module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'orders',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      orderNumber: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('BUY', 'SELL'),
        allowNull: false,
      },
      listingId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(5),
        allowNull: false,
        defaultValue: '',
      },
      userId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      brokerId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      coin: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      paymentMethod: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      paymentWindow: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      amount: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      price: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      fiatAmount: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      status: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      userStatus: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      brokerStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      disputeDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      popKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      podKey: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'orders',
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
