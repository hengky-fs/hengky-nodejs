module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'orderTimes',
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
      requestedAt: {
        type: DataTypes.DATE(6),
        allowNull: false,
      },
      acceptedAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      paidAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      completedAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      cancelledAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      expiredAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
      disputedAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'orderTimes',
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
