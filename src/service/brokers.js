const { Op } = require('sequelize');
const dayjs = require('dayjs');

const sequelize = require('../common/sequelize');
const {
  ordersDal,
  orderTimesDal,
  feedbacksDal,
  bankTypesDal,
  brokerPaymentMethodsDal,
  internalTransfersDal,
  usersDal,
  banksDal,
  listingsDal,
} = require('../dal');
const {
  banks,
} = require('../models');
const { CustomError } = require('../utils');
const { ERROR_CODES, ORDER_STATUS } = require('../constant');
const { config, logger, http, utils } = require('../common');
const UserSubAccountService = require('./userSubAccounts');
const AdminService = require('./admins');

class BrokerService {
  // BROKERS
  static async getProfile({ userId }) {
    const [totalOrder, completedOrders] = await Promise.all([
      ordersDal.count({ where: { brokerId: userId }}),
      ordersDal.findAll({
        attributes: ['orderNumber'],
        where: {
          brokerId: userId,
          status: ORDER_STATUS.STATUS.COMPLETED,
        }
      })
    ]);

    const completedOrderNumbers = completedOrders.map(({orderNumber}) => orderNumber);
    const totalCompletedOrders = completedOrders.length;
    let feedbacks = [];
    let totalFeedbacks = 0;
    let totalRate = 0;
    let orderSuccessCompletions = 0
    let avgReleaseTime = 0;
    let avgPayTime = 0;
    let rate = '0';
    const rates = { '5':0, '4':0, '3':0, '2':0, '1':0 };

    if (totalCompletedOrders > 0) {
      feedbacks = await feedbacksDal.findAll({
        where: { orderNumber: completedOrderNumbers, }
      });
      totalFeedbacks = feedbacks.length;
      
      // GROUPING rates
      feedbacks.forEach((fb) => {
        if (rates[`${fb.rate}`] !== undefined) rates[`${fb.rate}`] += 1;
      });

      // GET Rate
      Object.keys(rates).forEach((star) => {
        totalRate += (+star * rates[star]);
      });
      if (totalRate > 0) rate = (totalRate/totalFeedbacks).toFixed(1)

      // Release & Pay Times
      const orderTimes = await orderTimesDal.findAll({
        where: { orderNumber: completedOrderNumbers, }
      });

      const totalOrderTimes = orderTimes.length;
      let totalReleaseTime = 0;
      let totalPayTime = 0;
      if (totalOrderTimes > 0) {
        orderTimes.forEach((ot) => {
          const acceptedAt = dayjs(ot.acceptedAt);
          const paidAt = dayjs(ot.paidAt);
          const completedAt = dayjs(ot.completedAt);

          totalReleaseTime += completedAt.diff(paidAt, 'minute', true);
          totalPayTime += paidAt.diff(acceptedAt, 'minute', true);
        });
        avgReleaseTime = (totalReleaseTime/totalOrderTimes).toFixed(2);
        avgPayTime = (totalPayTime/totalOrderTimes).toFixed(2);
      }
    }

    if (totalOrder > 0) {
      orderSuccessCompletions = (totalCompletedOrders/totalOrder)*100;
      orderSuccessCompletions = orderSuccessCompletions.toFixed(2);
    }
    orderSuccessCompletions = `${orderSuccessCompletions}%`;

    return {
      totalCompletedOrders,
      totalFeedbacks,
      rate,
      rates,
      orderSuccessCompletions,
      avgReleaseTime,
      avgPayTime,
    };
  }

  static async getFeedbacks({ userId }, { page, limit }) {
    const completedOrders = await ordersDal.findAll({
      attributes: ['orderNumber'],
      where: {
        brokerId: userId,
        status: ORDER_STATUS.STATUS.COMPLETED,
      }
    });
    const completedOrderNumbers = completedOrders.map(({orderNumber}) => orderNumber);

    let total = 0;
    let filtered = 0;
    let feedbacks = [];
    if (completedOrders.length < 1) return { total, filtered, feedbacks};

    const query = { orderNumber: completedOrderNumbers };
    [total, { count: filtered, rows: feedbacks }] = await Promise.all([
      feedbacksDal.count({ where: query }),
      feedbacksDal.findAllWithRelationAndCountAll(
        { where: query },
        page,
        limit,
        [
          { model: banks, as: 'bank', },
        ]
      )
    ]);
    return { total, filtered, feedbacks};
  }

  static async getMyPaymentMethod({ userId }, { isActive }) {
    const query = { userId };
    if (isActive) query.isActive = ['true', true].includes(isActive);

    const brokerPaymentMethods = await brokerPaymentMethodsDal.findAllWithRelation(
      {
        where: query,
        order: [[ 'isActive', 'DESC' ]],
      },
      {
        model: banks,
        as: 'bank',
      }
    );

    const bankTypes = {};
    const bankTypesTmp = await bankTypesDal.findAll({});
    bankTypesTmp.forEach((bt) => { bankTypes[bt.id] = bt.name });

    brokerPaymentMethods.forEach((bpm, i) => {
      if (bpm.bank) {
        brokerPaymentMethods[i].bank.typeName = bankTypes[bpm.bank.type];
      }
    });

    return brokerPaymentMethods;
  }

  static async getMyPaymentMethodById({ id, userId }) {
    const brokerPaymentMethod = await brokerPaymentMethodsDal.findOneWithRelation(
      {
        where: { id, userId }
      },
      {
        model: banks,
        as: 'bank',
      }
    );
    if (!brokerPaymentMethod) throw new CustomError(ERROR_CODES.PAYMENT_METHOD_NOT_FOUND);

    const bankType = await bankTypesDal.findOne({
      id: brokerPaymentMethod.bank.type
    });
    brokerPaymentMethod.bank.typeName = bankType.name;

    return brokerPaymentMethod;
  }

  static async createMyPaymentMethod(params) {
    const {
      userId,
      bankId,
      accountName,
      accountNumber,
      accountBeneficiary,
      ibanNumber,
    } = params;

    const dataExists = await brokerPaymentMethodsDal.findOne({userId, bankId});
    if (dataExists) throw new CustomError(ERROR_CODES.PAYMENT_METHOD_EXISTS);

    // For now broker only can have one bank transfer
    const { bankType } = await AdminService.getBanksById({ id: bankId });
    if (bankType.name === 'BANK TRANSFER') {
      const bankData = await banksDal.findAll({ where: { type: bankType.id } });
      const bankIds = [];
      bankData.forEach(({id}) => bankIds.push(id));

      const exists = await brokerPaymentMethodsDal.findAll({ where: { bankId: bankIds, userId, } });
      if (exists && exists.length > 0) {
        throw new CustomError(ERROR_CODES.PAYMENT_METHOD_BT_ONLY_ONE);
      }
    }

    const bpm = await brokerPaymentMethodsDal.create(
      {
        userId,
        bankId,
        accountName,
        accountNumber,
        accountBeneficiary,
        ibanNumber,
        isActive: true,
      },
      { raw: true, returning: true }
    );
    await this.triggerListing(userId);

    return bpm;
  }

  static async updateMyPaymentMethod({ userId, id }, params) {
    await this.getMyPaymentMethodById({ id, userId });
    await brokerPaymentMethodsDal.updateById(id, params);
    await this.triggerListing(userId);

    return 'Success update payment method!';
  }

  static async activeInActiveMyPaymentMethod({ id, userId, isActive }) {
    if (!isActive) {
      const totalBrokerPaymentMethod = await brokerPaymentMethodsDal.count({ where: { isActive: true, userId } });

      if ((totalBrokerPaymentMethod - 1) < 1) {
        const totalActiveOrder = await ordersDal.count({ where: {
          [Op.or]: [
            { userId },
            { brokerId: userId },
          ],
          status: [ORDER_STATUS.STATUS.REQUESTED, ORDER_STATUS.STATUS.ACCEPTED],
        }});
        if (totalActiveOrder > 0) throw new CustomError(ERROR_CODES.INACTIVE_PAYMENT_METHOD_FAILED_BECAUSE_ACTIVE_ORDER);

        const totalActiveListing = await listingsDal.count({ where: { isActive: true, userId, brokerType: 'SELL' } });
        if (totalActiveListing > 0) throw new CustomError(ERROR_CODES.INACTIVE_PAYMENT_METHOD_FAILED_BECAUSE_ACTIVE_LISTING);
      }
    }

    await this.getMyPaymentMethodById({ id, userId });
    await brokerPaymentMethodsDal.updateById(id, { isActive });
    await this.triggerListing(userId);

    return `Success ${isActive ? 'activate' : 'inactivate'} payment method!`;
  }

  static async triggerListing(userId) {
    const listings = await listingsDal.count({ userId });
    if (listings < 1) return true;

    const transaction = await sequelize.transaction();
    try {
      let isUsingBankTransfer = false;
      let isUsingDigitalWallet = false;

      const [brokerPms, bts] = await Promise.all([
        brokerPaymentMethodsDal.findAllWithRelation(
          { where: { userId } },
          {
            model: banks,
            as: 'bank',
            attributes: { exclude: ['isActive', 'createdAt', 'updatedAt'] },
          },
          { exclude: ['createdAt', 'updatedAt'] }
        ),
        bankTypesDal.findAll({ where: { isActive: true }}),
      ]);
      brokerPms.forEach((bpm) => {
        if (bpm.isActive) {
          if (!isUsingBankTransfer) {
            const res = bts.find((bt) => bt.name === 'BANK TRANSFER' && bt.id === bpm.bank.type);
            if (res) isUsingBankTransfer = true;
          }
          if (!isUsingDigitalWallet) {
            const res = bts.find((bt) => bt.name === 'DIGITAL WALLET' && bt.id === bpm.bank.type);
            if (res) isUsingDigitalWallet = true;
          }
        }
      });
      await listingsDal.update({ userId }, {isUsingBankTransfer, isUsingDigitalWallet}, { transaction });
      await transaction.commit();
      return true;
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw new CustomError({
        code: 500,
        message: 'Internal server error, error at trigger ads',
      });
    }
  }

  // USERS
  static async getAddress(userId, coin = '') {
    if (coin) return usersDal.findOne({ userId, coin });
    return usersDal.findAll({ userId });
  }

  static async getSpotSubAccount(userId) {
    const url = `${config.tradingEngineUrl}/users/userSubAccounts/${userId}`;
    const { response } = await http.getRequest(url);
    utils.checkErrorExists(response);

    if (!response) {
      logger.error(`Spot wallet not exists for userId - ${userId}`);
      throw new CustomError({ code: 400, message: 'Spot wallet not exists!' });
    }

    return response;
  }

  static async internalTransfer({ userId }, { from, to, coin, amount }) {
    // GET Sub Account
    const [spotSubAccountTmp, user] = await Promise.all([
      this.getSpotSubAccount(userId),
      usersDal.findOne({ userId }),
    ]);
    const spotSubAccount = spotSubAccountTmp.result[0];

    // User not have p2p sub account ? then generate it
    let p2pSubAccount = user;
    if (!p2pSubAccount) p2pSubAccount = await UserSubAccountService.generateSubAccount(userId);

    // GET wallet
    const [spotWallet, p2pWallet] = await Promise.all([
      UserSubAccountService.getBalances('', spotSubAccount.email, coin),
      UserSubAccountService.getBalances('', p2pSubAccount.email, coin),
    ]);

    // Validation
    const validateParams = { amount, from, userId, coin };
    let fromId = '';
    let toId = '';
    switch (from) {
      case 'SPOT':
        fromId = spotSubAccount.subaccountId;
        toId = p2pSubAccount.subAccountId;
        await UserSubAccountService.validateBalance(spotWallet.free, validateParams);
        break;
      case 'P2P':
        fromId = p2pSubAccount.subAccountId;
        toId = spotSubAccount.subaccountId;
        await UserSubAccountService.validateBalance(p2pWallet.free, validateParams);
        break;
      default:
        logger.error(`internalTransfer - Case with ${from} is not in this system!`);
        throw new CustomError(ERROR_CODES.INTERNAL_TRANSFER_FAILED);
    }

    // Action
    const transfer = await internalTransfersDal.create(
      { userId, from, to, coin, amount },
      { raw: true, returning: true }
    );

    const response = await UserSubAccountService.transferBetweenAccounts(fromId, toId, coin, amount);
    if (!response.txnId) throw new CustomError(ERROR_CODES.INTERNAL_TRANSFER_FAILED);

    const { txnId, clientTranId } = response;
    await internalTransfersDal.updateById(transfer.id, { txnId, clientTranId, status: 'COMPLETED' });

    return {
      code: 201,
      message: 'Internal Transfer Success!',
      id: transfer.id,
    };
  }
}
module.exports = BrokerService;
