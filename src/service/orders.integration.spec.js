'use strict';

// const { setupIntegrationTest, mockAwsSes } = require('../tests');
// mockAwsSes();

// const nock = require('nock');
// const {
//   mockBinanceGetTickerPrice,
//   mockFixerGetPrice,
//   mockCoin,
// } = require('../tests/mocks');
// const config = require('../common/config');
// const { ERROR_CODES, ORDER_STATUS } = require('../constant');
// const listingsDal = require('../dal/listings');
// const { CustomError } = require('../utils');
// const OrderService = require('./orders');

// const mockBinanceGetSubAccountBalances = (subAccountEmail, response) => {
//   const defaultResponse = {
//     balances: [],
//     success: true,
//     ...response,
//   };
//   nock(config.binanceApi.url)
//     .get('/sapi/v3/sub-account/assets')
//     .query(({ email }) => email === subAccountEmail)
//     .reply(200, defaultResponse);
// };

// const mockBrokerProfile = (userId, userInfo) => {
//   const defaultResponse = {
//     code: 200,
//     errors: null,
//     result: {},
//     isSuccess: true,
//   };

//   nock(config.faeApiUrl)
//     .get(`/p2p/brokers/simpleProfile/${userId}`)
//     .reply(200, {
//       ...defaultResponse,
//       result: {
//         userInfo: {
//           ...userInfo,
//           id: userId,
//         },
//       },
//     });
// };

describe.skip('service/orders.integration', () => {
  // setupIntegrationTest();

  describe('createOrder()', () => {
    beforeEach(() => {
      mockBrokerProfile(24925, {
        name: 'Some User',
        email: 'some.user@gmail.com',
        legalName: 'Some User',
      });

      mockBrokerProfile(25101, {
        name: 'Onemore User',
        email: 'onemore.user@gmail.com',
        legalName: 'Onemore User',
      });

      mockBrokerProfile(25102, {
        name: 'Another User',
        email: 'another.user@gmail.com',
        legalName: 'Another User',
      });

      mockCoin('USDT', {
        name: 'Tether',
        symbol: 'USDT',
      });
    });

    afterEach(() => {
      nock.cleanAll();
    });

    // TODO: Need to check deeply for this test
    describe('for BUY listing', () => {
      it('should successfully create order', async () => {
        // Given
        mockCoin();
        const listingId = 2;
        const listing = await listingsDal.findOne({ id: listingId });

        const userId = 24925;
        const amount = 1;

        // When
        const newOrder = await OrderService.createOrder({
          listingId,
          userId,
          amount,
        });

        // Then
        expect(newOrder).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            orderNumber: expect.any(String),
            listingId,
            userId,
            amount,
            type: listing.type,
            currency: listing.currency,
            brokerId: listing.userId,
            coin: listing.coin,
            paymentWindow: listing.paymentWindow,
            price: listing.price,
            fiatAmount: +listing.price * +amount,
            status: ORDER_STATUS.STATUS.REQUESTED,
            userStatus: ORDER_STATUS.STATUS.REQUESTED,
          }),
        );
      });
    });

    describe('for SELL listing', () => {
      const listingId = 4;

      it('should successfully create order', async () => {
        // Given
        mockBinanceGetSubAccountBalances(
          'lp_23716117_419592644_brokersubuser@fasset.com',
          {
            balances: [{ asset: 'USDT', free: 11.70744197, locked: 0 }],
          },
        );
        mockBinanceGetTickerPrice();
        mockCoin();
        mockFixerGetPrice();

        const listing = await listingsDal.findOne({ id: listingId });
        const userId = 25101;
        const amount = 1;

        // When
        const newOrder = await OrderService.createOrder({
          listingId,
          userId,
          amount,
        });

        // Then
        expect(newOrder).toEqual(
          expect.objectContaining({
            id: expect.any(Number),
            orderNumber: expect.any(String),
            listingId,
            userId,
            amount,
            type: listing.type,
            currency: listing.currency,
            brokerId: listing.userId,
            coin: listing.coin,
            paymentWindow: listing.paymentWindow,
            price: listing.price,
            fiatAmount: +listing.price * +amount,
            status: ORDER_STATUS.STATUS.REQUESTED,
            userStatus: ORDER_STATUS.STATUS.REQUESTED,
          }),
        );
      });

      it('should throw error if user has insufficient balance', async () => {
        // Given
        mockBinanceGetSubAccountBalances(
          'lp_23716117_419592644_brokersubuser@fasset.com',
          {
            balances: [{ asset: 'USDT', free: 0.5, locked: 0 }],
          },
        );

        const userId = 25101;
        const amount = 1;

        // Then
        await expect(
          // When
          OrderService.createOrder({
            listingId,
            userId,
            amount,
          }),
        ).rejects.toThrow(
          new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_INSUFFICIENT_BALANCE),
        );
      });

      it('should throw error if user has no payment methods set up', async () => {
        // Given
        mockBinanceGetSubAccountBalances(
          'lp_23716117_415887926_brokersubuser@fasset.com',
          {
            balances: [{ asset: 'USDT', free: 1, locked: 0 }],
          },
        );
        const userId = 25096; // this user has no payment methods setup
        const amount = 1;

        // Then
        await expect(
          // When
          OrderService.createOrder({
            listingId,
            userId,
            amount,
          }),
        ).rejects.toThrow(
          new CustomError(
            ERROR_CODES.REQUEST_ORDER_FAILED_NO_PAYMENT_METHOD_SETUP,
          ),
        );
      });
    });
  });
});