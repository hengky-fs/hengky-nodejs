'use strict';

module.exports = {
  async up(queryInterface) {
    await queryInterface.addIndex('orders', ['orderNumber'], {
      name: 'orders_order_number',
      unique: true,
    });
    await queryInterface.addIndex('orderDisputes', ['orderNumber'], {
      name: 'order_disputes_order_number',
      unique: false,
    });
    await queryInterface.addIndex('orderTimes', ['orderNumber'], {
      name: 'order_times_order_number',
      unique: false,
    });
    await queryInterface.addIndex('orderTransfers', ['orderNumber'], {
      name: 'order_transfers_order_number',
      unique: false,
    });
    await queryInterface.addIndex('feedbacks', ['orderNumber'], {
      name: 'feedbacks_order_number',
      unique: false,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('orders', 'orders_order_number');
    await queryInterface.removeIndex(
      'orderDisputes',
      'order_disputes_order_number',
    );
    await queryInterface.removeIndex('orderTimes', 'order_times_order_number');
    await queryInterface.removeIndex(
      'orderTransfers',
      'order_transfers_order_number',
    );
    await queryInterface.removeIndex('feedbacks', 'feedbacks_order_number');
  },
};
