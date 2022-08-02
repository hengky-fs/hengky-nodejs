module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'feedbacks',
    {
      id: {
        autoIncrement: true,
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        primaryKey: true,
      },
      createdBy: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      orderNumber: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      coin: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      bankId: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rate: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'feedbacks',
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
