'use strict';

const { mockSequelize } = require('../tests');
mockSequelize();

const { CustomError } = require('../utils');
const { ERROR_CODES } = require('../constant');
const {
  mockCurrencies,
  mockCoin,
  mockBinanceGetTickerPrice,
  mockFixerGetPrice,
} = require('../tests/mocks');
const {
  listings,
  paymentMethods,
  bankTypes,
} = require('../tests/data');
const {
  listingsDal,
  brokerPaymentMethodsDal,
  bankTypesDal,
  ordersDal,
} = require('../dal');
const ListingService = require('./listings');
const UserSubAccountService = require('./userSubAccounts');

// Setup mocking
jest.mock('../dal', () => ({
  listingsDal: {
    findAndCountAll: jest.fn(),
    count: jest.fn(),
    findOne: jest.fn(),
  },
  brokerPaymentMethodsDal: {
    findAllWithRelation: jest.fn(),
    findOne: jest.fn(),
  },
  bankTypesDal: {
    findAll: jest.fn(),
  },
  ordersDal: {
    count: jest.fn(),
  },
}));

// Anonymous function for checking result of listing
const isListing = (params = {}) => (listing) => {
  const {
    isActive,
    currency,
    listingId,
  } = params;

  const result = {};
  if (isActive !== undefined) result.isActive = isActive;

  const numberExpectation = expect.any(Number);
  const stringExpectation = expect.any(String);
  const arrayExpectation = expect.any(Array);
  return expect.objectContaining({
    id: listingId || numberExpectation,
    userId: numberExpectation,
    brokerType: stringExpectation,
    type: stringExpectation,
    coin: stringExpectation,
    currency: expect.objectContaining({
      id: numberExpectation,
      name: stringExpectation,
      symbol: currency || stringExpectation,
      code: stringExpectation,
      countryCode: stringExpectation,
    }),
    price: stringExpectation,
    amount: stringExpectation,
    minLimit: stringExpectation,
    maxLimit: stringExpectation,
    minLimitFiat: stringExpectation,
    maxLimitFiat: stringExpectation,
    floatingPricePercentage: listing.floatingPricePercentage ? stringExpectation : null,
    paymentWindow: numberExpectation,
    message: stringExpectation,
    isUsingBankTransfer: numberExpectation,
    isUsingDigitalWallet: numberExpectation,
    paymentMethods: expect.objectContaining({
      bankTransfers: arrayExpectation,
      digitalWallets: arrayExpectation,
    }),
    ...result,
  });
}

describe('service/listings', () => {
  beforeEach(() => {
    listingsDal.findAndCountAll.mockReset();
    listingsDal.count.mockReset();
    listingsDal.findOne.mockReset();
    brokerPaymentMethodsDal.findAllWithRelation.mockReset();
    brokerPaymentMethodsDal.findOne.mockReset();
    bankTypesDal.findAll.mockReset();
    ordersDal.count.mockReset();
    mockCurrencies();
  });

  describe('getListing()', () => {
    it('should successfully get active listing', async () => {
      // We will display this query result on https://beta.fasset.tech/p2p
      listingsDal.count.mockResolvedValue(listings.length);
      listingsDal.findAndCountAll.mockResolvedValue({
        count: listings.length,
        rows: listings,
      });
      brokerPaymentMethodsDal.findAllWithRelation.mockResolvedValue(paymentMethods);
      bankTypesDal.findAll.mockResolvedValue(bankTypes);
      mockCoin();

      const isActive = true;
      const isActiveDb = isActive === true ? 1 : 0;
      const currency = 'PKR';
      const isActiveListing = isListing({
        isActive: isActiveDb,
        currency,
      });

      // When
      const result = await ListingService.getListing({
        isActive,
        currency,
      });

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          filtered: expect.any(Number),
          listings: expect.any(Array),
        }),
      );
      expect(result.listings).toEqual(
        expect.arrayContaining(result.listings.map(isActiveListing)),
      );
    });
  });

  describe('getListingById()', () => {
    it('should successfully get active listing by id', async () => {
      listingsDal.findOne.mockResolvedValue({
        ...listings[0],
        currency: 'PKR',
      });
      brokerPaymentMethodsDal.findAllWithRelation.mockResolvedValue(paymentMethods);
      bankTypesDal.findAll.mockResolvedValue(bankTypes);
      mockCurrencies('PKR', {
        id: 8,
        name: "Rupee Pakistan",
        code: "Rs",
        countryCode: "PK",
      });

      const listingId = 1;
      const isActiveListing = isListing({listingId});
      const result = await ListingService.getListingById({listingId});

      // Then
      expect(typeof result === 'object').toBeTruthy();
      [result].map(isActiveListing)
    });

    it('should return listing not found when get active listing by id', async () => {
      listingsDal.findOne.mockResolvedValue(undefined);

      const listingId = 1;
      const result = ListingService.getListingById({listingId});

      // Then
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.listingNotFound(listingId)));
    });
  });

  describe('validateCreateOrUpdateListing()', () => {
    it('should return cannot Change a listing because that listing has an active orders, when broker want to update a listing', async () => {
      ordersDal.count.mockResolvedValue(1);

      const listingId = 1;
      const brokerType = 'SELL';
      const floatingPricePercentage = '100';
      const params = {
        userId: 25046,
        brokerType,
        coin: 'BTC',
        currency: 'PKR',
        price: null,
        floatingPricePercentage,
        amount: '0.001',
        minLimit: '0.0005',
        maxLimit: '0.0008',
        paymentWindow: 10,
        message: 'Ad message',
      }

      // When
      const result = ListingService.validateCreateOrUpdateListing(params, listingId);

      // Then
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.LISTING_FAILED_TO_UPDATE_BECAUSE_HAS_ACTIVE_ORDER));
    });

    it('should successfully validate create listing for floatingPrice:true & brokerType:SELL', async () => {
      listingsDal.findOne.mockResolvedValue(undefined);
      brokerPaymentMethodsDal.findOne.mockResolvedValue(paymentMethods[0]);
      jest
        .spyOn(UserSubAccountService, 'getBalances')
        .mockReturnValue({
          asset: 'BTC',
          free: '0.1',
          locked: 0,
        });

      const brokerType = 'SELL';
      const floatingPricePercentage = '100';
      const params = {
        userId: 25046,
        brokerType,
        coin: 'BTC',
        currency: 'PKR',
        price: null,
        amount: '0.001',
        minLimit: '0.0005',
        maxLimit: '0.0008',
        floatingPricePercentage,
        paymentWindow: 10,
        message: 'Ad message',
      };

      // When
      const result = await ListingService.validateCreateOrUpdateListing(params);

      // Then
      expect(result).toEqual({
        ...params,
        type: brokerType === 'BUY' ? 'SELL' : 'BUY',
        isActive: true,
        floatingPricePercentage: (+floatingPricePercentage).toFixed(2),
        minLimitFiat: null,
        maxLimitFiat: null,
      });
    });
  });
});
