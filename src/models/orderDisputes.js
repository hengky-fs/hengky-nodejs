module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'orderDisputes',
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
      disputedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      zendeskNumber: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: ''
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REVOKED'),
        allowNull: false,
        defaultValue: 'PENDING'
      },
      actionedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      actionedAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
        defaultValue: null,
      },
      resolvedBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
      },
      resolvedAt: {
        type: DataTypes.DATE(6),
        allowNull: true,
        defaultValue: null,
      },
      isAutoDispute: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      tableName: 'orderDisputes',
      timestamps: true,
      indexes: [
        {
          name: 'PRIMARY',
          unique: true,
          using: 'BTREE',
          fields: [{ name: 'id' }],
        },
      ],
    },
  );
};
