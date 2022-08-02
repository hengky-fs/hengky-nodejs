'use strict';

const { mockSequelize } = require('../tests');
mockSequelize();

const { ERROR_CODES, ORDER_STATUS } = require('../constant');
const {
  listingsDal,
  ordersDal,
  feedbacksDal,
} = require('../dal');
const {
  orders,
} = require('../tests/data');
const { mockUser } = require('../tests/mocks');
const { CustomError } = require('../utils');
const OrderService = require('./orders');
const Encryption = require('../utils/encryption');

jest.mock('../dal', () => ({
  listingsDal: {
    findOne: jest.fn(),
  },
  ordersDal: {
    findOneWithRelation: jest.fn(),
    findOne: jest.fn(),
  },
  feedbacksDal: {
    create: jest.fn(),
  },
}));

describe('service/orders', () => {
  beforeEach(() => {
    listingsDal.findOne.mockReset();
    ordersDal.findOne.mockReset();
    ordersDal.findOneWithRelation.mockReset();
    feedbacksDal.create.mockReset();
  });

  describe('getOrderDetail()', () => {
    it('should return order not found when another account or fake order number trying to fetching an order', async () => {
      ordersDal.findOneWithRelation.mockResolvedValue(undefined);

      const orderNumber = '220705INV00000001';
      const result = OrderService.getOrderDetail({
        userId: 111,
        orderNumber,
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.orderNotFound(orderNumber)));
    });
  });

  describe('feedback()', () => {
    it('should return unauthorized when another account outside transaction trying to give a feedback', async () => {
      jest
        .spyOn(OrderService, 'getOrderDetail')
        .mockReturnValue({
          userId: 1,
          brokerId: 2,
        });

      const orderNumber = '220705INV00000001';
      const result = OrderService.feedback({
        requestedBy: 3,
        orderNumber,
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.UNAUTHORIZED));
    });

    it('should return broker cannot give a rate or feedback to their ad', async () => {
      jest
        .spyOn(OrderService, 'getOrderDetail')
        .mockReturnValue({
          userId: 1,
          brokerId: 2,
        });

      const orderNumber = '220705INV00000001';
      const result = OrderService.feedback({
        requestedBy: 2,
        orderNumber,
      });

      await expect(result).rejects.toThrow(new CustomError({
        code: 400,
        message: `Broker cannot give a rate or feedback to their Ad!`,
      }));
    });

    it('should return give feedback failed', async () => {
      jest
        .spyOn(OrderService, 'getOrderDetail')
        .mockReturnValue({
          userId: 1,
          brokerId: 2,
          status: { id: ORDER_STATUS.STATUS.PAID },
        });

      const orderNumber = '220705INV00000001';
      const result = OrderService.feedback({
        requestedBy: 1,
        orderNumber,
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.GIVE_FEEDBACK_FAILED_NOT_COMPLETED));
    });

    it('should successfully create feedback', async () => {
      const objReturn = { id: 'feedback-Id' };
      jest
        .spyOn(OrderService, 'getOrderDetail')
        .mockReturnValue({
          userId: 1,
          brokerId: 2,
          status: { id: ORDER_STATUS.STATUS.COMPLETED },
          paymentMethods: { bankId: 1 },
        });
      feedbacksDal.create.mockResolvedValue(objReturn);

      const orderNumber = '220705INV00000001';
      const result = await OrderService.feedback({
        requestedBy: 1,
        orderNumber,
      });

      expect(result).toBe(objReturn);
    });
  });

  describe('generateOrderChatUrl()', () => {
    const orderNumber = 'wrong-order-number';
    const params = {
      requestedBy: 1,
      orderNumber,
    };

    it('should return order not found', async () => {
      ordersDal.findOne.mockResolvedValue(undefined);
      const result = OrderService.generateOrderChatUrl(params);
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.orderNotFound(orderNumber)));
    });

    it('should successfully generate order chat url', async () => {
      const order = orders[0];
      ordersDal.findOne.mockResolvedValue(order);
      mockUser(order.brokerId);
      mockUser(order.userId);
      jest
        .spyOn(Encryption, 'encrypt')
        .mockReturnValue('random-hash');

      const result = await OrderService.generateOrderChatUrl(params);
      expect(typeof result).toBe('string');
    });
  });

  describe('listStatus()', () => {
    it('should return array of status objects', async () => {
      // Given
      const expectedResult = Object.keys(ORDER_STATUS.STATUS).map((name) => ({
        id: ORDER_STATUS.STATUS[name],
        name,
      }));

      // When
      const result = await OrderService.listStatus();

      // Then
      expect(result).toEqual(expectedResult);
    });
  });

  describe('createOrder()', () => {
    const listing = {
      id: 2,
      userId: 25102,
      isActive: true,
      minLimit: 1,
      maxLimit: 2,
      type: 'BUY',
      currency: 'PKR',
      coin: 'USDT',
      paymentWindow: 10,
      price: '175.123',
    };

    it('should throw error if buyer and seller are same user', async () => {
      // Given
      const userId = listing.userId;

      listingsDal.findOne.mockResolvedValue(listing);

      // Then
      await expect(
        // When
        OrderService.createOrder({
          listingId: listing.id,
          userId,
          amount: 1,
        }),
      ).rejects.toThrow(
        new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_SAME_USER),
      );
    });

    it('should throw error if listing is not active', async () => {
      // Given
      const nonActiveListing = {
        ...listing,
        isActive: false,
      };

      listingsDal.findOne.mockResolvedValue(nonActiveListing);

      // Then
      await expect(
        // When
        OrderService.createOrder({
          listingId: nonActiveListing.id,
          userId: 24925,
          amount: 1,
        }),
      ).rejects.toThrow(
        new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_INACTIVE),
      );
    });

    it('should throw error if amount is less than listing min limit', async () => {
      // Given
      const amount = 0.5;

      listingsDal.findOne.mockResolvedValue(listing);

      // Then
      await expect(
        // When
        OrderService.createOrder({
          listingId: listing.id,
          userId: 24925,
          amount,
        }),
      ).rejects.toThrow(
        new CustomError(ERROR_CODES.REQUEST_ORDER_FAILED_MINLIMIT),
      );
    });
  });
});
