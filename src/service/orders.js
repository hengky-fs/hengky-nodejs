const { Op } = require('sequelize');

const dayjs = require('dayjs');

const sequelize = require('../common/sequelize');
const {
  ordersDal,
  orderTimesDal,
  listingsDal,
  feedbacksDal,
  orderTransfersDal,
  usersDal,
  banksDal,
  orderDisputesDal,
  brokerPaymentMethodsDal,
} = require('../dal');
const {
  orderTimes,
  brokerPaymentMethods,
  listings,
  orderDisputes,
} = require('../models');
const { CustomError, Encryption } = require('../utils');
const {
  ERROR_CODES,
  ORDER_STATUS,
  ENUM,
} = require('../constant');
const { logger, utils, http, config } = require('../common');
const NotificationEngine = require('./notificationEngine');
const UserSubAccountService = require('./userSubAccounts');
const { createZendeskTicket } = require('../common/zendesk');
const PublicService = require('./publics');

const userProfilePath = `${config.faeApiUrl}/p2p/brokers/simpleProfile`;

class OrderService {
  // Main Functions ===========================================
  static async listStatus() {
    return Object.keys(ORDER_STATUS.STATUS).map((name) => ({
      id: ORDER_STATUS.STATUS[name],
      name,
    }));
  }

  static async getOrder(params) {
    const {
      orderNumber,
      listingId,
      currency,
      userId,
      brokerId,
      paymentMethod,
      status,
      type,
      coin,
      startDate,
      endDate,
      mergeUserAndBroker,
      fexAdmin,
      page,
      limit,
    } = params;

    const query = {};
    if (orderNumber) query.orderNumber = { [Op.like]: `%${orderNumber.toUpperCase()}%` };
    if (listingId) query.listingId = +listingId;
    if (currency) query.currency = currency;
    if (paymentMethod) query.paymentMethod = +paymentMethod;
    if (status) query.status = +status;
    if (coin) query.coin = coin;
    if (startDate || endDate) {
      const { start, end, } = utils.getDateParams(startDate, endDate);
      query.createdAt = { [Op.between]: [start, end] };
    }

    let userAndBrokerCondition = {};
    const inverseType = type === 'BUY' ? 'SELL' : 'BUY';
    if (mergeUserAndBroker && mergeUserAndBroker === 'true') {
      const val = userId || brokerId;
      if (type) {
        userAndBrokerCondition = {
          [Op.or]: [
            { type, userId: +val }, 
            { type: inverseType, brokerId: +val }
          ],
        };
      } else {
        userAndBrokerCondition = {
          [Op.or]: [
            { userId: +val }, 
            { brokerId: +val }
          ],
        };
      }
    } else {
      if (userId) query.userId = +userId;
      if (brokerId) query.brokerId = +brokerId;
    }

    let finalQuery = query;
    if (userAndBrokerCondition) {
      finalQuery = { ...query, ...userAndBrokerCondition };
    }

    const [total, { count: filtered, rows: orders }] = await Promise.all([
      ordersDal.count({ where: finalQuery }),
      ordersDal.findAndCountAll(
        {
          where: finalQuery,
          order: [['createdAt', 'DESC']],
        },
        page,
        limit,
      ),
    ]);

    // Get currencies data
    // I make decision here just for reduce calling when orders is zero
    let currencies = {};
    if (orders.length > 0) {
      currencies = await PublicService.getCurrenciesMap();
    }

    const userData = {};
    const userIds = [];
    if (fexAdmin) {
      orders.forEach((o) => {
        if (!userIds.includes(o.userId)) userIds.push(o.userId);
        if (!userIds.includes(o.brokerId)) userIds.push(o.brokerId);
      });
      await Promise.all(
        userIds.map(async (id) => {
          userData[id] = await this.getUser(id);
        })
      );
    }

    await Promise.all(
      orders.map(async (order, i) => {
        order.currency = currencies[order.currency];
        orders[i] = this.manipulateDetailOrder(order, userId);

        if (fexAdmin) {
          const pairs = await utils.convertCrypto(order.coin, order.amount);
          orders[i].usdValue = order.coin === 'USDT' ? +order.amount : pairs.USDT;
          orders[i].user = userData[order.userId];
          orders[i].broker = userData[order.brokerId];
        }
      })
    );

    return { total, filtered, orders};
  }

  static async getOrderDetail({userId, orderNumber}, internalFunction = true) {
    const query = internalFunction ? { orderNumber } : {
      [Op.or]: [
        { userId, orderNumber },
        { brokerId: userId, orderNumber },
      ]
    };

    let order = await ordersDal.findOneWithRelation(
      { where: query },
      [
        { model: orderTimes, as: 'orderTime', },
        { model: orderDisputes, as: 'orderDispute', },
        { model: brokerPaymentMethods, as: 'paymentMethods', },
      ]
    );
    if (!order) throw new CustomError(ERROR_CODES.orderNotFound(orderNumber));

    order = this.manipulateDetailOrder(order, userId);
    order.user = await this.getUser(order.userId);
    order.broker = await this.getUser(order.brokerId);
    order.pairs = await utils.convertCrypto(order.coin, order.amount);
    order.currency = await PublicService.getCurrencies(order.currency);

    if (order.popKey) order.popUrl = utils.getUrl(order.popKey);
    if (order.podKey) order.podUrl = utils.getUrl(order.podKey);
    if (order.status.id === ORDER_STATUS.STATUS.COMPLETED) {
      order.feedback = await feedbacksDal.findOne({orderNumber}) || null;
    }

    const { paymentMethods } = order;
    if (paymentMethods && paymentMethods.id) {
      const bank = await banksDal.findOne({ id: paymentMethods.bankId });
      order.paymentMethods = {
        ...paymentMethods,
        bankName: bank.name,
        bankType: bank.type === 1 ? 'BANK TRANSFER' : 'DIGITAL WALLET',
      }
    }

    return order;
  }

  static async hasFeedback({orderNumber, createdBy}) {
    const order = await feedbacksDal.findOne({ orderNumber, createdBy: +createdBy });
    if (!order) return false;
    return true;
  }

  static async createOrder(params) {
    const transaction = await sequelize.transaction();

    try {
      const { listingId, userId, amount } = params;

      // Validations
      const listing = await listingsDal.findOne({ id: listingId, isActive: true });
      if (!listing) throw new CustomError({
        code: 400,
        message: `Sorry! selected Ad is out of stock, please refresh and choose another Ad, Thank you!`
      });

      if (userId === listing.userId)
        throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_SAME_USER);
      if (!listing || !listing.isActive)
        throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_INACTIVE);
      if (+amount < +listing.minLimit)
        throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_MINLIMIT);

      const { type, coin } = listing;
      if (type === 'SELL') await this.validateBalance(userId, coin, amount, listing, 'createOrder');

      // Get current price for listing that use floating price
      let { price } = listing;
      let fiatAmount = +price * +amount;
      if (listing.floatingPricePercentage && listing.floatingPricePercentage !== '') {
        const currentPrice = await utils.convertCrypto(listing.coin, 1);
        const currentPricePkr = +((currentPrice.PKR).toFixed(2));
        price = (currentPricePkr * (+listing.floatingPricePercentage / 100)).toFixed(2);
        fiatAmount = (price * +amount).toFixed(2);
      }

      const status = ORDER_STATUS.STATUS.REQUESTED;
      const orderNumber = await this.generateOrderNumber();
      const order = await ordersDal.create(
        {
          orderNumber,
          type,
          coin,
          price,
          fiatAmount,
          currency: listing.currency,
          paymentWindow: listing.paymentWindow,
          listingId,
          userId,
          brokerId: listing.userId,
          amount,
          status,
          userStatus: status,
        },
        {
          raw: true,
          returning: true,
          transaction,
        }
      );

      await orderTimesDal.create({ orderNumber, requestedAt: order.createdAt }, { transaction });
      await NotificationEngine.sendNotification(order, listing);
      await transaction.commit();

      return order;
    } catch (err) {
      await transaction.rollback();
      throw new CustomError(err);
    }
  }

  static async changeOrderStatus({orderNumber}, {status, requestedBy, paymentMethod, popKey}) {
    const transaction = await sequelize.transaction();
    try {
      const order = await this.getOrderDetail({orderNumber});
      const {user, broker} = order;
      const listing = await listingsDal.findOne({id: order.listingId});

      if ([
        ORDER_STATUS.STATUS.REJECTED,
        ORDER_STATUS.STATUS.CANCELLED,
        ORDER_STATUS.STATUS.DISPUTED,
        ORDER_STATUS.STATUS.COMPLETED,
      ].includes(order.status.id)) {
        logger.error(`${orderNumber} rejected, cancelled, disputed, completed order cannot be changed!`);
        throw new CustomError(ERROR_CODES.PROCESS_ORDER_FAILED);
      }

      const data = this.validateChangeStatus(order, {orderNumber, status, requestedBy, paymentMethod, popKey});
      const orderTimeData = this.manipulateOrderTime(data);

      // Only broker can accept the order
      if (status === ORDER_STATUS.STATUS.ACCEPTED) {
        if (order.status.id !== ORDER_STATUS.STATUS.REQUESTED) {
          logger.error(
            `The order should be requested, you can't accept this order - ${orderNumber}!`
          );
          throw new CustomError(ERROR_CODES.PROCESS_ORDER_FAILED);
        }

        // This means SELL for broker and this is only for broker
        if (order.type === 'BUY') {
          await this.validateBalance(order.brokerId, order.coin, order.amount, listing, 'acceptOrder');

          // Reduce listing availability
          const updatedAmount = +listing.amount - +order.amount;
          const updatedListing = { amount: updatedAmount };
          if (updatedAmount < +listing.minLimit) {
            Object.assign(updatedListing, { isActive: false });
          }
          await listingsDal.updateById(listing.id, updatedListing, { transaction });
        }
      }

      if (status === ORDER_STATUS.STATUS.COMPLETED) {
        if (order.status.id !== ORDER_STATUS.STATUS.PAID) {
          logger.error(`The order still not paid, you can't complete this order - ${orderNumber}!`);
          throw new CustomError(ERROR_CODES.PROCESS_ORDER_FAILED);
        }

        const uId = order.type === 'BUY' ? order.brokerId : order.userId;
        await this.validateBalance(uId, order.coin, order.amount, listing);

        // Check p2p account
        const { from, to } = await this.checkP2PSubAccount({
          userId: order.userId,
          brokerId: order.brokerId,
          type: order.type,
        });

        // Record the order transaction
        const ot = await orderTransfersDal.create({
          orderNumber,
          from: from.subAccountId,
          to: to.subAccountId,
          coin: listing.coin,
          amount: order.amount,
        });

        // Send between subaccount
        const res = await UserSubAccountService.transferBetweenAccounts(
          from.subAccountId,
          to.subAccountId,
          listing.coin,
          order.amount,
        );
        if (!res.txnId) throw new CustomError(ERROR_CODES.INTERNAL_TRANSFER_FAILED);

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

      // Action
      await ordersDal.updateById(order.id, data, { transaction });
      await orderTimesDal.update({ orderNumber }, orderTimeData, { transaction });
      await NotificationEngine.sendNotification({
        ...order,
        status: data.status,
        userStatus: data.userStatus,
        brokerStatus: data.brokerStatus,
      }, listing, user, broker);
      await transaction.commit();

      return `Success update order to ${ORDER_STATUS.STATUS_BY_ID[status]}!`;
    } catch (err) {
      await transaction.rollback();
      throw new CustomError(err);
    }
  }

  static async rejectCancelDispute({orderNumber}, params) {
    const transaction = await sequelize.transaction();
    try {
      const {
        status,
        requestedBy,
        message,
        disputeDescription,
        podKey,
      } = params;

      const order = await this.getOrderDetail({orderNumber});
      const {user, broker, amount, listingId} = order;

      // Validation
      if (![
        ORDER_STATUS.STATUS.REJECTED,
        ORDER_STATUS.STATUS.CANCELLED,
        ORDER_STATUS.STATUS.DISPUTED,
      ].includes(status)) {
        throw new CustomError(ERROR_CODES.PROCESS_ORDER_FAILED);
      }
      if (status === ORDER_STATUS.STATUS.REJECTED) {
        if (order.status.id !== ORDER_STATUS.STATUS.REQUESTED) {
          logger.error('Rejected only accept from requested order');
          throw new CustomError(ERROR_CODES.PROCESS_ORDER_FAILED);
        }
      }
      if (status === ORDER_STATUS.STATUS.CANCELLED) {
        if (![
          ORDER_STATUS.STATUS.REQUESTED,
          ORDER_STATUS.STATUS.ACCEPTED,
        ].includes(order.status.id)) {
          logger.error('Canceled only accept from requested & accepted order');
          throw new CustomError(ERROR_CODES.PROCESS_ORDER_FAILED);
        }
      }

      const data = this.validateChangeStatus(order, {orderNumber, status, requestedBy});
      const orderTimeData = this.manipulateOrderTime(data);

      if (status === ORDER_STATUS.STATUS.CANCELLED) {
        if (order.status.id === ORDER_STATUS.STATUS.ACCEPTED) {
          // Increase listing availability
          // We only increase after broker accept an order
          const listing = await listingsDal.findOne({id: listingId});

          const updatedAmount = +listing.amount + +amount;
          const updatedListing = { amount: updatedAmount };
          if (updatedAmount >= +listing.minLimit) {
            Object.assign(updatedListing, { isActive: true });
          }
          await listingsDal.updateById(listing.id, updatedListing, { transaction });
        }
      }

      if (status === ORDER_STATUS.STATUS.DISPUTED) {
        if (order.status.id === ORDER_STATUS.STATUS.COMPLETED) {
          throw new CustomError({
            code: 400,
            message: `Please try refresh the page, the order already Completed!`,
          });
        }
        if (order.status.id !== ORDER_STATUS.STATUS.PAID) {
          logger.error(JSON.stringify({
            orderNumber,
            message: `orders/rejectCancelDispute() - This transaction status is ${order.status.name}`,
          }));
          throw new CustomError({
            code: 400,
            message: `Dispute order failed please try refresh the page or try again later!`,
          });
        }
        const result = await createZendeskTicket(user, broker, requestedBy, order, orderTimeData, message, disputeDescription, podKey);
        const ticketId = result?.response?.ticket?.id;
        await orderDisputesDal.create(
          {
            orderNumber,
            disputedBy: requestedBy,
            zendeskNumber: ticketId,
          },
          { transaction }
        );
      }

      data.message = message;
      if (disputeDescription) data.disputeDescription = disputeDescription;
      if (podKey) data.podKey = podKey;

      await ordersDal.updateById(order.id, data, { transaction });
      await orderTimesDal.update({ orderNumber }, orderTimeData, { transaction });
      await NotificationEngine.sendNotification({
        ...order,
        status: data.status,
        userStatus: data.userStatus,
        brokerStatus: data.brokerStatus,
      }, {}, user, broker);

      await transaction.commit();

      return `${ORDER_STATUS.STATUS_BY_ID[status]} order success!`;
    } catch (err) {
      await transaction.rollback();
      throw new CustomError(err);
    }
  }

  static async feedback(params) {
    const {
      orderNumber,
      requestedBy,
      requestedByName,
      comment = null,
      rate,
    } = params;

    const {
      status,
      userId,
      brokerId,
      coin,
      paymentMethods,
    } = await this.getOrderDetail({orderNumber});
    if (![userId, brokerId].includes(requestedBy)) {
      logger.error(JSON.stringify({
        message: `Feedback() - ${orderNumber} requestedBy (${requestedBy}) is not part of userId or brokerId!`,
        params,
      }));
      throw new CustomError(ERROR_CODES.UNAUTHORIZED);
    }
    if (requestedBy === brokerId) {
      logger.error(JSON.stringify({
        message: 'Feedback() - Broker cannot give a rate or feedback to their Ad!',
        params,
      }));
      throw new CustomError({
        code: 400,
        message: `Broker cannot give a rate or feedback to their Ad!`,
      });
    }
    if (status.id !== ORDER_STATUS.STATUS.COMPLETED) {
      logger.error(JSON.stringify({
        message: 'Feedback() - Cannot give feedback or rating if the transaction status is not completed!',
        params,
      }));
      throw new CustomError(ERROR_CODES.GIVE_FEEDBACK_FAILED_NOT_COMPLETED);
    }

    return feedbacksDal.create(
      {
        createdBy: requestedBy,
        orderNumber,
        name: requestedByName,
        coin,
        bankId: paymentMethods.bankId,
        comment,
        rate,
      },
      { raw: true, returning: true, }
    );
  }

  static async generateOrderChatUrl(params) {
    const { requestedBy, orderNumber } = params;

    const order = await ordersDal.findOne({
      [Op.or]: [
        { userId: requestedBy, orderNumber },
        { brokerId: requestedBy, orderNumber },
      ]
    });
    if (!order) throw new CustomError(ERROR_CODES.orderNotFound(orderNumber));

    const { brokerId, userId, } = order;
    const [ broker, user ] = await Promise.all([
      this.getUser(brokerId),
      this.getUser(userId),
    ]);

    const encryptedData = Encryption.encrypt({
      id: order.id,
      orderNumber,
      actionBy: requestedBy === brokerId ? 'BROKER' : 'USER',
      brokerId,
      brokerName: broker.name || broker.legalName,
      brokerEmail: broker.email,
      userId,
      userName: user.name || user.legalName,
      userEmail: user.email,
    }, config.p2pChat.signingKey);
    const urlResult = config.p2pChat.url + encryptedData;

    return urlResult;
  }

  // Additional Functions ===========================================
  static manipulateOrderTime(data) {
    const today = new Date();
    const result = {};
    switch (data.status) {
      case ORDER_STATUS.STATUS.ACCEPTED:
        result.acceptedAt = today;
        break;
      case ORDER_STATUS.STATUS.PAID:
        result.paidAt = today;
        break;
      case ORDER_STATUS.STATUS.COMPLETED:
        result.completedAt = today;
        break;
      case ORDER_STATUS.STATUS.REJECTED:
        result.rejectedAt = today;
        break;
      case ORDER_STATUS.STATUS.CANCELLED:
        result.cancelledAt = today;
        break;
      case ORDER_STATUS.STATUS.EXPIRED:
        result.expiredAt = today;
        break;
      case ORDER_STATUS.STATUS.DISPUTED:
        result.disputedAt = today;
        break;
      default:
        break;
    }
    return result;
  }

  static async getUser(userId) {
    const { response } = await http.getRequest(`${userProfilePath}/${userId}`);
    utils.checkErrorExists(response);
    return response.result;
  }

  static manipulateDetailOrder(oldOrder, userId) {
    const order = oldOrder;
    const statusId = order.status;
    const buyerStatusId = order.userStatus;
    const sellerStatusId = order.brokerStatus;

    // Only swap when broker get order
    if (+userId === order.brokerId) {
      order.type = order.type === 'BUY' ? 'SELL' : 'BUY';
    }

    order.status = {
      id: statusId,
      name: ORDER_STATUS.STATUS_BY_ID[statusId],
    }
    order.userStatus = {
      id: buyerStatusId,
      name: ORDER_STATUS.STATUS_BY_ID[buyerStatusId],
    }
    if (sellerStatusId) {
      order.brokerStatus = {
        id: sellerStatusId,
        name: ORDER_STATUS.STATUS_BY_ID[sellerStatusId],
      }
    }

    return order;
  }

  static async checkP2PSubAccount({userId, brokerId, type}) {
    const [subAccountUserTmp, subAccountBrokerTmp] = await Promise.all([
      usersDal.findOne({ userId }),
      usersDal.findOne({ userId: brokerId }),
    ]);

    // Generate if account not exists
    let subAccountUser = subAccountUserTmp;
    let subAccountBroker = subAccountBrokerTmp;
    if (!subAccountUser) subAccountUser = await UserSubAccountService.generateSubAccount(userId);
    if (!subAccountBroker) subAccountBroker = await UserSubAccountService.generateSubAccount(brokerId);

    let from = null;
    let to = null;
    if (type === 'BUY') {
      from = subAccountBroker;
      to = subAccountUser;
    } else {
      from = subAccountUser;
      to = subAccountBroker;
    }

    return { from, to };
  }

  static async generateOrderNumber() {
    const startDay = dayjs().startOf('day').toDate();
    const date = dayjs().format('YYMMDD');
    let digit = '0000000';
    let totalInvoiceToday = await ordersDal.count({
      where: { createdAt: { [Op.gt]: startDay } }
    });
    digit = `${digit}${totalInvoiceToday + 1}`.slice(-8);

    let orderNumber = `${date}INV${digit}`;
    const order = await ordersDal.findOne({ orderNumber });
    if (order) {
      totalInvoiceToday += 1;
      digit = `${digit}${totalInvoiceToday + 1}`.slice(-8);
      orderNumber = `${date}INV${digit}`;
    }

    return orderNumber;
  }

  static async validateBalance(userId, coin, amount, listing, action = '') {
    const myPaymentMethods = await brokerPaymentMethodsDal.findAll({ where: { userId, isActive: true }});
    if (myPaymentMethods.length < 1) {
      throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_NO_PAYMENT_METHOD_SETUP);
    }

    const balance = await UserSubAccountService.getBalances(userId, null, coin);
    const errReturn = {
      code: 400,
      message: 'Sorry! The amount of coins you are trying to sell are currently locked to your ads. Please transfer more coins before proceeding.'
    };

    if (action) {
      const query = {
        listingId: listing.id,
        status: [
          ORDER_STATUS.STATUS.ACCEPTED,
          ORDER_STATUS.STATUS.PAID,
          ORDER_STATUS.STATUS.DISPUTED,
        ],
      };
      let message = '';

      if (action === 'createOrder') {
        if (+balance.free < +amount) throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_INSUFFICIENT_BALANCE);

        // If validation above this line passed, we should do checking more deep, that's checking active order
        query.userId = userId;
        message = 'Sorry! The amount of coins that you are trying to Sell are currently locked into your Active Orders (accepted, paid, disputed). Please transfer more coins before proceeding.'
      }
      if (action === 'acceptOrder') {
        query.brokerId = userId;
        message = 'Sorry! The amount of coins that you are trying to Accept are currently locked into your Active Orders (accepted, paid, disputed) of this Ad. Please transfer more coins before proceeding.'
      }

      // We do this validation when broker accept order or broker sell coin by create order
      const activeOrderTotalAmount = await ordersDal.sum('amount', query);
      if (+amount > (+listing.amount - activeOrderTotalAmount)) {
        throw new CustomError({ ...errReturn, message, });
      }
    }
    if (+balance.free < +amount) throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_INSUFFICIENT_BALANCE);
  }

  static validateChangeStatus(order, {orderNumber, status, requestedBy, paymentMethod, popKey}) {
    const data = { status };

    if (order.status.id === ORDER_STATUS.STATUS.EXPIRED) {
      throw new CustomError(ERROR_CODES.orderExpired(orderNumber));
    }
    if (status === ORDER_STATUS.STATUS.PAID) {
      if (!paymentMethod) throw new CustomError(ERROR_CODES.PAYMENT_METHOD_REQUIRED);
      data.paymentMethod = paymentMethod;
      data.popKey = popKey;
    }
    if (![order.userId, order.brokerId].includes(requestedBy)) {
      logger.error(`${orderNumber} requestedBy (${requestedBy}) is not part of userId or brokerId!`);
      throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED);
    }

    if (requestedBy === order.userId) {
      if (order.userStatus && order.userStatus.id === status) {
        logger.error(`${orderNumber} userStatus is same with status that wanna change, should check payload from FE!`);
        throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED);
      }
      data.userStatus = status;
    }
    if (requestedBy === order.brokerId) {
      if (order.brokerStatus && order.brokerStatus.id === status) {
        logger.error(`${orderNumber} brokerStatus is same with status that wanna change, should check payload from FE!`);
        throw new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED);
      }
      data.brokerStatus = status;
    }

    return data;
  }

  // Cron Job Functions ===========================================
  static async expiredOrder() {
    let totalOrderRequested = 0;
    let totalOrderAccepted = 0;
    let totalOrderExpired = 0;
    const today = new Date();
    const transaction = await sequelize.transaction();
  
    try {
      const orders = await ordersDal.findAllWithRelation(
        {
          where: {
            status: { [Op.or]: [ORDER_STATUS.STATUS.REQUESTED, ORDER_STATUS.STATUS.ACCEPTED] }
          }
        },
        [
          { model: listings, as: 'listing', },
          { model: orderTimes, as: 'orderTime', },
        ]
      );
      if (orders.length < 1) {
        logger.info('Success - There are no orders to expire!');
        await transaction.rollback();
        return true;
      }

      const userIds = [];
      const orderRequestedsExecute = [];
      const orderAcceptedsExecute = [];
  
      // This loop will reduce to filter unique users
      orders.forEach((order) => {
        const {
          orderNumber,
          status,
          listing,
          orderTime,
          userId,
          brokerId,
        } = order;
        const { requestedAt, acceptedAt, } = orderTime;
  
        if (status === ORDER_STATUS.STATUS.REQUESTED) {
          const requestTime = dayjs(requestedAt);
          const currentTime = dayjs(today);
          const diff = currentTime.diff(requestTime, 'minute');
          if (diff >= ENUM.ORDER_LIMIT_TIME.ACCEPT) {
            orderRequestedsExecute.push(orderNumber);
            if (userId && !userIds.includes(userId)) userIds.push(userId);
            if (brokerId && !userIds.includes(brokerId)) userIds.push(brokerId);
          }
        }
  
        if (status === ORDER_STATUS.STATUS.ACCEPTED) {
          const acceptTime = dayjs(acceptedAt);
          const currentTime = dayjs(today);
          const diff = acceptTime.diff(currentTime, 'minute');

          const paymentWindow = order.paymentWindow || listing.paymentWindow;
          if (Math.abs(diff) >= paymentWindow) {
            orderAcceptedsExecute.push(orderNumber);
            if (userId && !userIds.includes(userId)) userIds.push(userId);
            if (brokerId && !userIds.includes(brokerId)) userIds.push(brokerId);
          }
        }
      });
  
      // Get unique users
      const users = {};
      await Promise.all(
        userIds.map(async (id) => {
          users[id] = await this.getUser(id);
        }),
      );

      // Make sure there's no duplicate orderNumber, even call from DB
      const key = 'orderNumber';
      const freshOrders = [...new Map(orders.map(item => [item[key], item])).values()];

      const message = 'Auto Expired';
      const orderNumbers = [];
      const promises = [];
      const brokerStatus = ORDER_STATUS.STATUS.EXPIRED;
      const userStatus = brokerStatus;
      freshOrders.forEach(async (order) => {
        const { id, orderNumber, status } = order;
  
        if (status === ORDER_STATUS.STATUS.REQUESTED) {
          if (orderRequestedsExecute.includes(orderNumber)) {
            promises.push(
              ordersDal.updateById(id, { status: brokerStatus, brokerStatus, message }, { transaction }),
              orderTimesDal.update({ orderNumber }, { expiredAt: today }, { transaction }),
              NotificationEngine.sendNotification(
                { ...order, status: brokerStatus, brokerStatus, },
                {},
                users[order.userId],
                users[order.brokerId],
              ),
            );
            totalOrderRequested += 1;
            totalOrderExpired += 1;
            orderNumbers.push(orderNumber);
          }
        }
  
        if (status === ORDER_STATUS.STATUS.ACCEPTED) {
          if (orderAcceptedsExecute.includes(orderNumber)) {
            promises.push(
              ordersDal.updateById(id, { status: userStatus, userStatus, message }, { transaction }),
              orderTimesDal.update({ orderNumber }, { expiredAt: today }, { transaction }),
              NotificationEngine.sendNotification(
                { ...order, status: userStatus, userStatus, },
                {},
                users[order.userId],
                users[order.brokerId],
              ),
            );
            totalOrderAccepted += 1;
            totalOrderExpired += 1;
            orderNumbers.push(orderNumber);
          }
        }
      });
      await Promise.all(promises);
      await transaction.commit();
  
      logger.info(JSON.stringify({
        message: 'Expiration order check has been finished!',
        totalOrdersChecked: freshOrders.length,
        totalOrderRequested,
        totalOrderAccepted,
        totalOrderExpired,
        orderNumbers,
      }));
      return true;
    } catch (err) {
      await transaction.rollback();
      throw new CustomError(err);
    }
  }  

  static async autoDisputedOrder() {
    let totalOrderPaid = 0;
    let totalOrderDisputed = 0;
    let totalOrderZendeskNotCreated = 0;
    const today = new Date();
    const userStatus = ORDER_STATUS.STATUS.DISPUTED;

    try {
      const orders = await ordersDal.findAllWithRelation(
        {
          where: { status: ORDER_STATUS.STATUS.PAID }
        },
        [
          { model: listings, as: 'listing', },
          { model: orderTimes, as: 'orderTime', },
        ]
      );
      if (orders.length < 1) {
        logger.info('Success - There are no orders to dispute!');
        return true;
      }

      const userIds = [];
      const orderPaidsExecute = [];

      // This loop will reduce to filter unique users
      orders.forEach((order) => {
        const {
          orderNumber,
          orderTime,
          userId,
          brokerId,
          listing,
        } = order;
        const { paidAt } = orderTime;

        const paidTime = dayjs(paidAt);
        const currentTime = dayjs(today);
        const diff = currentTime.diff(paidTime, 'minute');

        const paymentWindow = order.paymentWindow || listing.paymentWindow;
        if (Math.abs(diff) >= paymentWindow) {
          orderPaidsExecute.push(orderNumber);
          if (userId && !userIds.includes(userId)) userIds.push(userId);
          if (brokerId && !userIds.includes(brokerId)) userIds.push(brokerId);
        }
      });

      // Get unique users
      const users = {};
      await Promise.all(
        userIds.map(async (id) => {
          users[id] = await this.getUser(id);
        }),
      );

      // Make sure there's no duplicate orderNumber, even call from DB
      const key = 'orderNumber';
      const freshOrders = [...new Map(orders.map(item => [item[key], item])).values()];

      const orderNumbers = [];
      const message = 'Auto Dispute';
      const disputeDescription = `Broker didn't release the coin within time period!`;
      await Promise.all(
        freshOrders.map(async (order) => {
          const { id, orderNumber, } = order;
          if (orderPaidsExecute.includes(orderNumber)) {
            const orderDisputeExists = await orderDisputesDal.findOne({ orderNumber });
            if (!orderDisputeExists) {
              const transaction = await sequelize.transaction();
              try {
                const disputedAt = today;
                const orderTimeData = { disputedAt };
                const result = await createZendeskTicket(
                  users[order.userId],
                  users[order.brokerId],
                  undefined,
                  order,
                  orderTimeData,
                  message,
                  disputeDescription,
                );
                const ticketId = result?.response?.ticket?.id;

                if (result.ok && ticketId) {
                  await orderDisputesDal.create({ orderNumber, zendeskNumber: ticketId, isAutoDispute: true }, { transaction });
                  await ordersDal.updateById(id, { status: userStatus, userStatus, message, disputeDescription }, { transaction });
                  await orderTimesDal.update({ orderNumber }, { disputedAt }, { transaction });
                  await NotificationEngine.sendNotification(
                    { ...order, status: userStatus, userStatus, },
                    {},
                    users[order.userId],
                    users[order.brokerId],
                  );

                  totalOrderPaid += 1;
                  totalOrderDisputed += 1;
                  orderNumbers.push(orderNumber);
                  await transaction.commit();
                } else {
                  totalOrderZendeskNotCreated += 1;
                  await transaction.rollback();
                }
              } catch (err) {
                await transaction.rollback();
                throw new CustomError(err);
              }
            }
          }
        })
      );

      logger.info(JSON.stringify({
        message: 'Disputing order check has been finished!',
        totalOrdersChecked: freshOrders.length,
        totalOrderPaid,
        totalOrderDisputed,
        totalOrderZendeskNotCreated,
        orderNumbers,
      }));
      return true;
    } catch (err) {
      throw new CustomError(err);
    }
  }
}
module.exports = OrderService;
