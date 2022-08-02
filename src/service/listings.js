const { Op } = require('sequelize');

const sequelize = require('../common/sequelize');
const {
  listingsDal,
  brokerPaymentMethodsDal,
  bankTypesDal,
  ordersDal,
} = require('../dal');
const {
  banks,
} = require('../models');
const { CustomError } = require('../utils');
const { ERROR_CODES, ORDER_STATUS } = require('../constant');
const { utils, logger } = require('../common');
const UserSubAccountService = require('./userSubAccounts');
const BrokerService = require('./brokers');
const PublicService = require('./publics');

class ListingService {
  // PUBLIC FUNCTION
  static async getListing({ type, coin, currency, userId, isActive = 'true', paymentMethod, maxLimitFiat, page, limit }) {
    return this.allListing({ type, coin, currency, userId, isActive, paymentMethod, maxLimitFiat, page, limit });
  }

  static async getListingById({ listingId }) {
    return this.detailListing({ listingId: +listingId, isActive: true });
  }

  static async highestLowestPrice({ coin, brokerType }) {
    const params = { isActive: true, coin, brokerType };

    const [highestPrice, lowestPrice, initialPriceTmp] = await Promise.all([
      listingsDal.findAll({
        attributes: [[ sequelize.fn('max', sequelize.col('price')), 'max' ]],
        where: params,
      }),
      listingsDal.findAll({
        attributes: [[ sequelize.fn('min', sequelize.col('price')), 'min']],
        where: params,
      }),
      utils.convertCrypto(coin, 1)
    ]);

    const initialPrice = initialPriceTmp.PKR.toFixed(2);
    return {
      highestPrice: highestPrice[0].max || initialPrice,
      lowestPrice: lowestPrice[0].min || initialPrice,
    }
  }

  // USER FUNCTION
  static async getMyListing({ userId }, { isActive = 'all', brokerType, coin, createdAtStart, createdAtEnd, page, limit }) {
    return this.allListing({ userId, isActive, brokerType, coin, createdAtStart, createdAtEnd, page, limit });
  }

  static async getMyListingById({ listingId, userId }) {
    return this.detailListing({ listingId, userId });
  }

  static async createMyListing(params) {
    const transaction = await sequelize.transaction();
    try {
      const data = await this.validateCreateOrUpdateListing(params);
      const listing = await listingsDal.create(data, { raw: true, returning: true }, { transaction });
      await BrokerService.triggerListing(data.userId);
      await transaction.commit();

      return listing;
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw new CustomError(error);
    }
  }

  static async updateMyListing({ listingId }, params) {
    const transaction = await sequelize.transaction();
    try {
      const { userId } = params;

      const listing = await listingsDal.findOne({ id: listingId, userId });
      if (!listing) throw new CustomError(ERROR_CODES.listingNotFound(listingId));

      const data = await this.validateCreateOrUpdateListing(params, listingId);
      await listingsDal.updateById(listingId, data, { transaction });

      return 'Success update listing!';
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw new CustomError(error);
    }
  }

  static async validateCreateOrUpdateListing(params, listingId) {
    const {
      userId,
      brokerType,
      coin,
      currency,
      price,
      amount,
      minLimit,
      maxLimit,
      floatingPricePercentage,
      paymentWindow,
      message,
    } = params;

    // Validations
    const code = 400;
    if (+minLimit <= 0 || +maxLimit <= 0 || +amount <= 0) throw new CustomError({
      code,
      message: 'Min Limit, max limit, or amount should have a value!',
    });
    if (+minLimit > +maxLimit) throw new CustomError({
      code,
      message: 'Min Limit should not more than max limit!',
    });
    if (+maxLimit > +amount) throw new CustomError({
      code,
      message: 'Max limit should not more than amount!',
    });

    if (!listingId) {
      // This mean broker create an ad
      const listingExists = await listingsDal.findOne({ userId, coin, brokerType });
      if (listingExists) throw new CustomError({
        code,
        message: 'You have another ads with same coin, you can use that ads!',
      });
    } else {
      // This mean broker wanna update selected ad
      const totalActiveOrder = await ordersDal.count({ where: {
        listingId,
        brokerId: userId,
        status: [
          ORDER_STATUS.STATUS.ACCEPTED,
          ORDER_STATUS.STATUS.PAID,
        ],
      }});
      if (totalActiveOrder > 0) throw new CustomError(ERROR_CODES.LISTING_FAILED_TO_UPDATE_BECAUSE_HAS_ACTIVE_ORDER);
    }

    if (brokerType === 'SELL') {
      const isBrokerHavePm = await brokerPaymentMethodsDal.findOne({ userId, isActive: true });
      if (!isBrokerHavePm) throw new CustomError({
        code,
        message: 'You have to set payment method & make it active first!',
      });

      const balance = await UserSubAccountService.getBalances(userId, null, coin);
      if (+balance.free <= 0 || +balance.free < +amount) {
        throw new CustomError(ERROR_CODES.INSUFFICIENT_BALANCE);
      }
    }

    const floatingData = {};
    let floatingPricePercentageNumber = 0;
    if (floatingPricePercentage && floatingPricePercentage !== '') {
      floatingPricePercentageNumber = (+floatingPricePercentage).toFixed(2);
      if (floatingPricePercentageNumber <= 0) throw new CustomError({
        code,
        message: 'Cannot set percentage to be 0!',
      });

      Object.assign(floatingData, {
        price: null,
        minLimitFiat: null,
        maxLimitFiat: null,
        floatingPricePercentage: floatingPricePercentageNumber,
      });
    } else {
      Object.assign(floatingData, {
        price,
        minLimitFiat: +minLimit * +price,
        maxLimitFiat: +maxLimit * +price,
        floatingPricePercentage: null,
      });
    }

    const data = {
      ...floatingData,
      userId,
      brokerType,
      type: brokerType === 'BUY' ? 'SELL' : 'BUY',
      coin,
      currency,
      amount,
      minLimit,
      maxLimit,
      paymentWindow,
      message,
    };
    if (!listingId) data.isActive = true;

    return data;
  }

  static async activeInActiveMyListing({ listingId, userId, isActive }) {
    const transaction = await sequelize.transaction();
    try {
      const listing = await listingsDal.findOne({ id: listingId, userId });
      if (!listing) throw new CustomError(ERROR_CODES.listingNotFound(listingId));

      if (isActive) await this.validateCreateOrUpdateListing(listing, listingId);
      await listingsDal.updateById(listingId, { isActive }, { transaction });
      await BrokerService.triggerListing(userId);

      return `Success ${isActive ? 'activate' : 'inactivate'} listing!`;
    } catch (error) {
      logger.error(error);
      await transaction.rollback();
      throw new CustomError(error);
    }
  }

  // HELPER FUNCTIONS
  static brokerPaymentMethodsTmpList(userIds = [], isActive) {
    const params = { userId: userIds, isActive: true };
    if (isActive === 'all') delete params.isActive;

    return brokerPaymentMethodsDal.findAllWithRelation(
      { where: params },
      {
        model: banks,
        as: 'bank',
        attributes: { exclude: ['isActive', 'createdAt', 'updatedAt'] },
      },
      { exclude: ['createdAt', 'updatedAt'] }
    );
  }

  static async allListing({ type, brokerType, coin, currency, userId, isActive = 'true', paymentMethod, maxLimitFiat, createdAtStart, createdAtEnd, page, limit }) {
    const query = {};
    if (type) query.type = type;
    if (brokerType) query.brokerType = brokerType;
    if (coin) query.coin = coin;
    if (currency) query.currency = currency;
    if (userId) query.userId = userId;
    if (paymentMethod) {
      if (paymentMethod === 'BANK_TRANSFER') query.isUsingBankTransfer = true;
      if (paymentMethod === 'DIGITAL_WALLET') query.isUsingDigitalWallet = true;
    }
    if (isActive) {
      if ([true, 'true'].includes(isActive)) query.isActive = true;
      if ([false, 'false'].includes(isActive)) query.isActive = false;
      // else for 'all' -> This is for My Ads Page
    }
    // For now we have to use manual filter since we have floatingPrice
    if (maxLimitFiat) {
      page = 1;
      limit = 1000;
    }
    if (createdAtStart || createdAtEnd) {
      const { start, end, } = utils.getDateParams(createdAtStart, createdAtEnd);
      query.createdAt = { [Op.between]: [start, end] };
    }

    const total = await listingsDal.count({ where: query });
    const { count: filtered, rows: listingsTmp } = await listingsDal.findAndCountAll(
      {
        where: query,
        order: [[ 'price', 'ASC' ]],
      },
      page,
      limit,
    );

    // For now we have to use manual filter since we have floatingPrice
    if (maxLimitFiat) {
      listingsTmp.map((l) => l.maxLimitFiat <= maxLimitFiat);
    }

    // Get currencies data
    // I make decision here just for reduce calling when listing is zero
    let currencies = {};
    if (listingsTmp.length > 0) {
      currencies = await PublicService.getCurrenciesMap();
    }

    const userIds = listingsTmp.map((listing) => listing.userId);
    const [brokerPaymentMethodsTmp, bankTypesTmp] = await Promise.all([
      this.brokerPaymentMethodsTmpList([...new Set(userIds)]),
      bankTypesDal.findAll({})
    ]);

    const bankTypes = {};
    const bpms = {};
    bankTypesTmp.forEach((bt) => { bankTypes[bt.id] = bt; });
    brokerPaymentMethodsTmp.forEach((bpm) => {
      if (bpms[bpm.userId]) {
        bpms[bpm.userId].push(bpm);
      } else {
        bpms[bpm.userId] = [bpm];
      }
    });

    // Filter coins from listings
    const coins = [];
    listingsTmp.forEach((listing) => {
      if (!coins.includes(listing.coin)) coins.push(listing.coin);
    });

    // Get current prices
    const prices = {};
    await Promise.all(
      coins.map(async (c) => {
        // Get current price of {COIN}PKR
        if (!prices[`${c}PKR`]) {
          const price = await utils.convertCrypto(c, 1);
          prices[`${c}PKR`] = +((price.PKR).toFixed(2));
        }
      })
    );

    // Manipulate listing
    const listings = [];
    listingsTmp.forEach((listing) => {
      listing.paymentMethods = {
        bankTransfers: [],
        digitalWallets: [],
      };
      const bpmBroker = bpms[listing.userId];
      if (bpmBroker) {
        bpmBroker.forEach(({bank}) => {
          const bt = bankTypes[bank.type];
          if (bt) {
            if (bt.name === 'BANK TRANSFER') {
              listing.paymentMethods.bankTransfers.push(bank.name);
            }
            if (bt.name === 'DIGITAL WALLET') {
              listing.paymentMethods.digitalWallets.push(bank.name);
            }
          }
        });
      }

      listing = this.manipulateListing(prices[`${listing.coin}PKR`], listing);
      listing.currency = currencies[listing.currency];
      listings.push(listing);
    })

    return { total, filtered, listings };
  }

  static async detailListing({ listingId, isActive, userId }) {
    const query = {};
    if (listingId) query.id = listingId;
    if (userId) query.userId = userId;
    if (isActive && isActive !== undefined) query.isActive = isActive;

    let listing = await listingsDal.findOne(query);
    if (!listing) throw new CustomError(ERROR_CODES.listingNotFound(listingId));

    const [brokerPaymentMethodsTmp, bankTypesTmp] = await Promise.all([
      this.brokerPaymentMethodsTmpList([listing.userId]),
      bankTypesDal.findAll({})
    ]);

    const bankTypes = {};
    bankTypesTmp.forEach((bt) => { bankTypes[bt.id] = bt.name });

    listing.paymentMethods = [];
    brokerPaymentMethodsTmp.forEach((bpm) => {
      if (bpm.bank) bpm.bank.typeName = bankTypes[bpm.bank.type];
      listing.paymentMethods.push(bpm);
    });

    // Get current price of {COIN}PKR
    const currentPrice = await utils.convertCrypto(listing.coin, 1);
    const currentPricePkr = +((currentPrice.PKR).toFixed(2));
    listing = this.manipulateListing(currentPricePkr, listing);

    // Get currency data
    listing.currency = await PublicService.getCurrencies(listing.currency);

    return listing;
  }

  static manipulateListing(currentPricePkr, listing) {
    // Set floating price
    if (listing.floatingPricePercentage && listing.floatingPricePercentage !== '') {
      listing.price = (currentPricePkr * (+listing.floatingPricePercentage / 100)).toFixed(2);
      listing.minLimitFiat = (+listing.minLimit * listing.price).toFixed(2);
      listing.maxLimitFiat = (+listing.maxLimit * listing.price).toFixed(2);
    }

    return listing;
  }
}
module.exports = ListingService;
