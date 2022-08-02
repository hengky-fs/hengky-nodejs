'use strict';

module.exports = {
  async up(queryInterface, { DataTypes }) {
    await queryInterface.createTable(
      'bankTypes',
      {
        id: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        name: {
          type: DataTypes.STRING(255),
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

    await queryInterface.createTable(
      'banks',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        type: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        name: {
          type: DataTypes.STRING(255),
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

    await queryInterface.createTable(
      'brokerPaymentMethods',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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
      },
    );

    await queryInterface.createTable(
      'disputeReasons',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        type: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        reason: {
          type: DataTypes.STRING(255),
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

    await queryInterface.createTable(
      'feedbacks',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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

    await queryInterface.createTable(
      'internalTransfers',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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

    await queryInterface.createTable(
      'listings',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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
        currencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        price: {
          type: DataTypes.STRING(255),
          allowNull: false,
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
          allowNull: false,
        },
        maxLimitFiat: {
          type: DataTypes.STRING(255),
          allowNull: false,
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
        },
        isUsingBankTransfer: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
        },
        isUsingDigitalWallet: {
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

    await queryInterface.createTable(
      'notificationTemplates',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        type: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
        },
        slug: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        subject: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        body: {
          type: DataTypes.TEXT,
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

    await queryInterface.createTable(
      'notifications',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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

    await queryInterface.createTable(
      'orderDisputes',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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
        },
        status: {
          type: DataTypes.ENUM('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REVOKED'),
          allowNull: false,
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

    await queryInterface.createTable(
      'orderTimes',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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

    await queryInterface.createTable(
      'orderTransfers',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        orderNumber: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        from: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        to: {
          type: DataTypes.STRING(255),
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

    await queryInterface.createTable(
      'orders',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
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
        currencyId: {
          type: DataTypes.INTEGER.UNSIGNED,
          allowNull: false,
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

    await queryInterface.createTable(
      'users',
      {
        id: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
          autoIncrement: true,
          primaryKey: true,
        },
        userId: {
          type: DataTypes.BIGINT.UNSIGNED,
          allowNull: false,
        },
        subAccountId: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        apiKey: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        apiSecretKey: {
          type: DataTypes.STRING(255),
          allowNull: true,
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
  },
  async down(queryInterface) {
    await queryInterface.dropTable('bankTypes');
    await queryInterface.dropTable('banks');
    await queryInterface.dropTable('brokerPaymentMethods');
    await queryInterface.dropTable('coins');
    await queryInterface.dropTable('currencies');
    await queryInterface.dropTable('disputeReasons');
    await queryInterface.dropTable('feedbacks');
    await queryInterface.dropTable('internalTransfers');
    await queryInterface.dropTable('listings');
    await queryInterface.dropTable('notificationTemplates');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('orderDisputes');
    await queryInterface.dropTable('orderTimes');
    await queryInterface.dropTable('orderTransfers');
    await queryInterface.dropTable('orders');
    await queryInterface.dropTable('users');
  },
};
