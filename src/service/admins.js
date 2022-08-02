const { Op } = require('sequelize');

const sequelize = require('../common/sequelize');
const {
  banksDal,
  bankTypesDal,
  ordersDal,
  listingsDal,
  disputeReasonsDal,
  orderDisputesDal,
  orderTimesDal,
  orderTransfersDal,
  usersDal,
} = require('../dal');
const {
  bankTypes,
  orders,
  orderTimes,
} = require('../models');
const { utils, config, logger } = require('../common');
const { CustomError, RedisCache } = require('../utils');
const { ERROR_CODES, ORDER_STATUS, DISPUTE_ORDERS } = require('../constant');
const NotificationEngine = require('./notificationEngine');
const OrderService = require('./orders');
const UserSubAccountService = require('./userSubAccounts');
const PublicService = require('./publics');

class AdminService {
  // BANK TYPES ============================================
  static async getBankTypes() {
    return bankTypesDal.findAll({
      order: [[ 'isActive', 'DESC' ]],
    });
  }

  static async getBankTypesById({ id }) {
    const data = await bankTypesDal.findOne({id});
    if (!data) throw new CustomError(ERROR_CODES.DATA_NOT_EXISTS);

    return data;
  }

  static async createBankTypes(params) {
    const { name, isActive, } = params;
    const upName = name.toUpperCase();

    const dataExists = await bankTypesDal.findOne({ name: upName });
    if (dataExists) throw new CustomError(ERROR_CODES.DATA_EXISTS);

    return bankTypesDal.create(
      {
        name: upName,
        isActive,
      },
      { raw: true, returning: true }
    );
  }

  static async updateBankTypes({ id }, params) {
    await this.getBankTypesById({ id });
    if (params.name) params.name = params.name.toUpperCase()
    await bankTypesDal.updateById(id, params);
    return 'Success update bank types!';
  }

  // BANKS ============================================
  static async getBanks() {
    return banksDal.findAll({
      order: [[ 'isActive', 'DESC' ]],
    });
  }

  static async getBanksById({ id }) {
    const data = await banksDal.findOneWithRelation(
      { where: { id }},
      [ { model: bankTypes, as: 'bankType' } ]
    );
    if (!data) throw new CustomError(ERROR_CODES.DATA_NOT_EXISTS);

    return data;
  }

  static async createBanks(params) {
    const { type, name, isActive, } = params;
    const upName = name.toUpperCase();

    const dataExists = await banksDal.findOne({ name: upName });
    if (dataExists) throw new CustomError(ERROR_CODES.DATA_EXISTS);

    return banksDal.create(
      {
        type,
        name: upName,
        isActive,
      },
      { raw: true, returning: true }
    );
  }

  static async updateBanks({ id }, params) {
    await this.getBanksById({ id });
    if (params.name) params.name = params.name.toUpperCase()
    await banksDal.updateById(id, params);

    return 'Success update banks!';
  }

  // DISPUTE REASONS ============================================
  static async getDisputeReasons({ isActive }) {
    const tableName = 'disputeReasons';
    const params = {};
    if (isActive) params.isActive = ['true', true].includes(isActive);

    let disputeReasons = await RedisCache.hget(tableName, isActive);
    if (!disputeReasons) {
      disputeReasons = await disputeReasonsDal.findAll({ where: params });
      await RedisCache.hmset(tableName, isActive, disputeReasons);
    }

    return disputeReasons;
  }

  static async getDisputeReasonsById({ id }) {
    const data = await disputeReasonsDal.findOne({id});
    if (!data) throw new CustomError(ERROR_CODES.DATA_NOT_EXISTS);

    return data;
  }

  static async createDisputeReasons(params) {
    const { type, reason, isActive, } = params;

    return disputeReasonsDal.create(
      {
        type,
        reason,
        isActive,
      },
      { raw: true, returning: true }
    );
  }

  static async updateDisputeReasons({ id }, params) {
    await this.getDisputeReasonsById({ id });
    await disputeReasonsDal.updateById(id, params);

    return 'Success update dispute reason!';
  }

  // REPORTS ============================================
  static async getListingReport() {
    const [
      activeListing,
      inactiveListing,
    ] = await Promise.all([
      listingsDal.count({ where: { isActive: true } }),
      listingsDal.count({ where: { isActive: false } }),
    ]);

    return {
      activeListing,
      inactiveListing,
    };
  }

  // static async getUserReport() {
  //   create new table user
  // }

  static async getKycReport() {
    return {
      totalIncompleteKyc: 0,
      totalPendingKyc: 0,
      totalVerifiedKyc: 0,
      // totalNotStartKyc: 0,
    };
  }

  static async getEscrowReport(params) {
    const { start, end, } = utils.getDateParams(params.startAt, params.endAt);
    const queries = {
      createdAt: { [Op.between]: [start, end] }
    }
    console.log(queries);

    const [
      coins
    ] = await Promise.all([
      utils.getCoins()
    ]);

    return {
      code: 'USDT',
      symbol: '$',
      totalEscrowAmount: 0,
      totalCoin: 0,
      totalCoinListing: coins.length,
    }
  }

  static async getFiatTransactionReport(params) {
    console.log(params);
    // const { start, end, } = utils.getDateParams(params.startAt, params.endAt);
    // const queries = {
    //   createdAt: { [Op.between]: [start, end] }
    // }

    // const [
    //   paidOrders,
    //   pendingOrders,
    // ] = await Promise.all([
    //   ordersDal.sum('usdValue', { ...queries, userStatus: ORDER_STATUS.STATUS.PAID }),
    //   ordersDal.sum('usdValue', { ...queries, status: ORDER_STATUS.STATUS.ACCEPTED }),
    // ]);

    return {
      code: 'USDT',
      symbol: '$',
      paidOrders: null,
      pendingOrders: null,
    }
  }

  static async getReportOrder(params) {
    const { start, end, } = utils.getDateParams(params.startAt, params.endAt);
    const queries = {
      createdAt: { [Op.between]: [start, end] }
    }

    const [
      total,
      totalRequested,
      totalAccepted,
      totalPaid,
      totalCompletedByUser,
      totalCompletedByBroker,
      totalRejected,
      totalExpired,
      totalDisputedByUser,
      totalDisputedByBroker,
    ] = await Promise.all([
      ordersDal.count({where: queries}),
      ordersDal.count({where: { ...queries, status: ORDER_STATUS.STATUS.REQUESTED }}),
      ordersDal.count({where: { ...queries, status: ORDER_STATUS.STATUS.ACCEPTED }}),
      ordersDal.count({where: { ...queries, status: ORDER_STATUS.STATUS.PAID }}),
      ordersDal.count({where: { ...queries, userStatus: ORDER_STATUS.STATUS.COMPLETED }}),
      ordersDal.count({where: { ...queries, brokerStatus: ORDER_STATUS.STATUS.COMPLETED }}),
      ordersDal.count({where: { ...queries, status: ORDER_STATUS.STATUS.REJECTED }}),
      ordersDal.count({where: { ...queries, status: ORDER_STATUS.STATUS.EXPIRED }}),
      ordersDal.count({where: { ...queries, userStatus: ORDER_STATUS.STATUS.DISPUTED }}),
      ordersDal.count({where: { ...queries, brokerStatus: ORDER_STATUS.STATUS.DISPUTED }}),
    ]);

    return {
      order: {
        total,
        totalRequested,
        totalAccepted,
        totalPaid,
        totalCompletedByUser,
        totalCompletedByBroker,
        totalRejected,
        totalExpired,
        totalDisputedByUser,
        totalDisputedByBroker,
      }
    };
  }

  static async getUsers() {
    const users = await usersDal.findAll({
      where: {},
      order: [['userId', 'ASC']],
      attributes: ['userId'],
    });
    return users;
  }

  // DISPUTE ORDERS ============================================
  static async getDisputeOrders(params) {
    const {
      status,
      orderNumber,
      isAutoDispute,
      zendeskNumber,
      page = 1,
      limit,
    } = params;

    const query = {};
    if (orderNumber) query.orderNumber = orderNumber.toUpperCase();
    if (isAutoDispute) query.isAutoDispute = [true, 'true'].includes(isAutoDispute);
    if (zendeskNumber) query.zendeskNumber = zendeskNumber;

    if (status) {
      const bigFontStatus = status.toUpperCase();
      if (bigFontStatus === 'RESOLVEDREVOKED') {
        Object.assign(query, {
          [Op.or]: [
            { status: DISPUTE_ORDERS.STATUS.RESOLVED },
            { status: DISPUTE_ORDERS.STATUS.REVOKED }
          ]
        });
      } else {
        query.status = bigFontStatus;
      }
    }

    const [total, { count: filtered, rows: orderDisputes }] = await Promise.all([
      orderDisputesDal.count({ where: query }),
      orderDisputesDal.findAllWithRelationAndCountAll(
        {
          where: query,
          order: [['createdAt', 'ASC']],
        },
        page,
        limit,
        [
          { model: orders, as: 'order' },
          { model: orderTimes, as: 'orderTime' },
        ]
      ),
    ]);

    // Get currencies data
    // I make decision here just for reduce calling when orders is zero
    let currencies = {};
    if (orderDisputes.length > 0) currencies = await PublicService.getCurrenciesMap();

    orderDisputes.forEach((od, i) => {
      orderDisputes[i] = this.manipulateOrderDispute(od, currencies);
    });

    return { total, filtered, orders: orderDisputes };
  }

  static async updateDisputeOrders({ orderNumber, status, adminId, notes }) {
    const today = new Date();
    const transaction = await sequelize.transaction();
    try {
      const { total, orders: orderDisputes } = await this.getDisputeOrders({ orderNumber });
      if (!total || total && total < 1) throw new CustomError(ERROR_CODES.orderNotFound(orderNumber));

      const orderDispute = orderDisputes[0];
      if (orderDispute.status === status) {
        logger.error(`[P2P] updateDisputeOrders() - The status that FE gives is same as the current status (${orderNumber})`);
        throw new CustomError(ERROR_CODES.BAD_REQUEST);
      }

      const data = { status: status.toUpperCase() };
      if (status === DISPUTE_ORDERS.STATUS.IN_PROGRESS) {
        data.actionedBy = adminId;
        data.actionedAt = today;
      }
      if ([
        DISPUTE_ORDERS.STATUS.REVOKED,
        DISPUTE_ORDERS.STATUS.RESOLVED,
      ].includes(status)) {
        if (!notes || notes && notes.length < 1) {
          throw new CustomError({
            code: 400,
            message: 'Notes required to Revoked or Resolved order!'
          });
        }

        data.notes = notes;
        data.resolvedBy = adminId;
        data.resolvedAt = today;

        const {
          userId,
          brokerId,
          type,
          coin,
          amount,
          listingId,
        } = orderDispute.order;

        if (status === DISPUTE_ORDERS.STATUS.RESOLVED) {
          // Check p2p account
          const { from, to } = await OrderService.checkP2PSubAccount({ userId, brokerId, type, });

          // Record the order transaction
          const ot = await orderTransfersDal.create({
            orderNumber,
            from: from.subAccountId,
            to: to.subAccountId,
            coin,
            amount,
          });

          // Send between subaccount
          const res = await UserSubAccountService.transferBetweenAccounts(
            from.subAccountId,
            to.subAccountId,
            coin,
            amount,
          );
          if (!res || !res.txnId) throw new CustomError(ERROR_CODES.INTERNAL_TRANSFER_FAILED);

          // Update the order transaction status
          await orderTransfersDal.updateById(
            ot.id,
            {
              txnId: res.txnId,
              clientTranId: res.clientTranId,
              status: 'COMPLETED',
            },
            { transaction },
          );
        }

        if (status === DISPUTE_ORDERS.STATUS.REVOKED) {
          if (type === 'BUY') {
            // Increase listing availability
            const listing = await listingsDal.findOne({id: listingId});

            const updatedAmount = +listing.amount + +amount;
            const updatedListing = { amount: updatedAmount };
            if (updatedAmount >= +listing.minLimit) {
              Object.assign(updatedListing, { isActive: true });
            }
            await listingsDal.updateById(listing.id, updatedListing, { transaction });
          }
        }

        await ordersDal.update({ orderNumber }, { status: ORDER_STATUS.STATUS.COMPLETED }, { transaction });
        await orderTimesDal.update({ orderNumber }, { completedAt: today }, { transaction });
      }

      await orderDisputesDal.update({ orderNumber }, data, { transaction });
      await NotificationEngine.sendNotification({
        orderNumber,
        userId: orderDispute.order.userId,
        brokerId: orderDispute.order.brokerId,
        status: ORDER_STATUS.STATUS.DISPUTED,
        disputeStatus: status,
      });
      await transaction.commit();

      return `Success update order dispute from ${orderDispute.status} to ${status} - ${orderNumber}`;
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw new CustomError(error);
    }
  }

  static async updateNotesDisputeOrders({ orderNumber, adminId, notes }) {
    const orderDispute = await orderDisputesDal.findOne({ orderNumber });
    if (!orderDispute) throw new CustomError(ERROR_CODES.orderNotFound(orderNumber));

    if (orderDispute.resolvedBy !== adminId) {
      throw new CustomError({ code: 400, message: `You don't have access to change the notes of this order!` });
    }

    await orderDisputesDal.update({ orderNumber }, { notes });
    return `Success update notes - ${orderNumber}`;
  }

  static async orderDisputeChangeAssigner({ orderNumber, targetAdminId, adminId }) {
    const transaction = await sequelize.transaction();
    try {
      const orderDispute = await orderDisputesDal.findOne({
        orderNumber,
        status: DISPUTE_ORDERS.STATUS.IN_PROGRESS,
      });
      if (!orderDispute) throw new CustomError(ERROR_CODES.orderNotFound(orderNumber));

      if (orderDispute.actionedBy !== adminId) {
        throw new CustomError({ code: 400, message: `You don't have access to change assigner!` });
      }

      await orderDisputesDal.update({ orderNumber }, { actionedBy: targetAdminId }, { transaction });
      await transaction.commit();

      return `Success change assigner - ${orderNumber}`;
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw new CustomError(error);
    }
  }

  // PRIVATE FUNCTIONS ============================================
  static manipulateOrderDispute (orderDispute, currencies) {
    const {
      zendeskNumber,
      order,
      orderTime,
    } = orderDispute;

    const currency = currencies[order.currency];
    orderDispute.order.fiatAmount = `${currency.code} ${order.fiatAmount}`;

    const result = {
      ...orderDispute,
      orderTime: orderTime.acceptedAt,
      disputedCriteria: order.message,
      zendeskUrl: `${config.zendesk.url}/${zendeskNumber}`,
    };

    return result;
  }
}
module.exports = AdminService;
