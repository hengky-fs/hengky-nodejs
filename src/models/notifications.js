module.exports = function (sequelize, DataTypes) {
  return sequelize.define(
    'notifications',
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
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      webLink: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      androidLink: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      iosLink: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      sequelize,
      tableName: 'notifications',
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
