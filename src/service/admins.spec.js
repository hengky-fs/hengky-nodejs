'use strict';

const { mockSequelize } = require('../tests');

mockSequelize();

const {
  orderDisputesDal,
  orderTransfersDal,
  listingsDal,
  ordersDal,
  usersDal,
  orderTimesDal,
} = require('../dal');
const {
  listings,
  orderDisputes,
  users,
} = require('../tests/data');
const { mockCurrencies } = require('../tests/mocks');
const { DISPUTE_ORDERS, ERROR_CODES } = require('../constant');
const { CustomError } = require('../utils');
const AdminService = require('./admins');
const OrderService = require('./orders');
const UserSubAccountService = require('./userSubAccounts');
const NotificationEngine = require('./notificationEngine');

// Setup mocking
jest.mock('../dal', () => ({
  orderDisputesDal: {
    count: jest.fn(),
    findAllWithRelationAndCountAll: jest.fn(),
    update: jest.fn(),
  },
  orderTransfersDal: {
    create: jest.fn(),
    updateById: jest.fn(),
  },
  listingsDal: {
    findOne: jest.fn(),
    updateById: jest.fn(),
  },
  ordersDal: {
    update: jest.fn(),
  },
  orderTimesDal: {
    update: jest.fn(),
  },
  usersDal: {
    findAll: jest.fn(),
  },
}));

const isOrderDispute = (params = {}) => (dispute) => {
  return expect.objectContaining({
    id: expect.any(Number),
    orderNumber: expect.any(String),
    zendeskNumber: expect.any(String),
    zendeskUrl: expect.any(String),
    disputedCriteria: dispute.order.message,
    disputedBy: dispute.isAutoDispute ? null : expect.any(Number),
    ...params,
  });
};

const isUser = () => () => expect.objectContaining({
  userId: expect.any(Number),
});

describe('service/admins', () => {
  beforeEach(() => {
    orderDisputesDal.count.mockReset();
    orderDisputesDal.findAllWithRelationAndCountAll.mockReset();
    orderDisputesDal.update.mockReset();
    orderTransfersDal.create.mockReset();
    listingsDal.findOne.mockReset();
    listingsDal.updateById.mockReset();
    ordersDal.update.mockReset();
    orderTimesDal.update.mockReset();
    usersDal.findAll.mockReset();
  });

  describe('getDisputeOrders()', () => {
    it('should successfully get order disputes by status', async () => {
      orderDisputesDal.count.mockResolvedValue(1);
      orderDisputesDal.findAllWithRelationAndCountAll.mockResolvedValue({
        count: orderDisputes.length,
        rows: orderDisputes,
      });
      mockCurrencies();

      const status = DISPUTE_ORDERS.STATUS.PENDING;
      const isPendingDispute = isOrderDispute({
        actionedAt: null,
        actionedBy: null,
        resolvedAt: null,
        resolvedBy: null,
        status,
      });

      // When
      const result = await AdminService.getDisputeOrders({ status });

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          total: expect.any(Number),
          filtered: expect.any(Number),
          orders: expect.any(Array),
        }),
      );

      expect(result.orders).toEqual(
        expect.arrayContaining(result.orders.map(isPendingDispute)),
      );
    });
  });

  describe('updateDisputeOrders()', () => {
    // Initialize
    const orderNumber = '220329INV00000008';
    const errorDataParam = {
      orderNumber,
      status: DISPUTE_ORDERS.STATUS.IN_PROGRESS,
      adminId: Math.floor(Math.random() * 100),
      notes: 'random-notes',
    };

    // Negative scenario
    it('should return order not found when admin update wrong order', async () => {
      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: 0,
          orders: [],
        });

      const result = AdminService.updateDisputeOrders(errorDataParam);
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.orderNotFound(orderNumber)));
    });

    it('should return order not found when admin update wrong order', async () => {
      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: orderDisputes.length,
          orders: orderDisputes,
        });

      const result = AdminService.updateDisputeOrders({
        ...errorDataParam,
        status: DISPUTE_ORDERS.STATUS.PENDING,
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.BAD_REQUEST));
    });

    it('should return notes required when admin want to revoked or resolved order', async () => {
      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: orderDisputes.length,
          orders: orderDisputes,
        });

      const resolveRevokedStatus = [DISPUTE_ORDERS.STATUS.RESOLVED, DISPUTE_ORDERS.STATUS.REVOKED];
      const randResolveRevokedStatus = resolveRevokedStatus[Math.floor(Math.random() * resolveRevokedStatus.length)];
      const notes = [undefined, ''];
      const result = AdminService.updateDisputeOrders({
        ...errorDataParam,
        status: randResolveRevokedStatus,
        notes: notes[Math.floor(Math.random() * notes.length)],
      });

      await expect(result).rejects.toThrow(new CustomError({
        code: 400,
        message: 'Notes required to Revoked or Resolved order!'
      }));
    });

    it('should return internal transfer failed when admin want to resolved order', async () => {
      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: orderDisputes.length,
          orders: orderDisputes,
        });
      jest
        .spyOn(OrderService, 'checkP2PSubAccount')
        .mockReturnValue({
          from: { subAccountId: 'random-from-sub-account' },
          to: { subAccountId: 'random-to-sub-account' },
        });
      orderTransfersDal.create.mockResolvedValue({ id: 'random-orderTransferId' });
      jest
        .spyOn(UserSubAccountService, 'transferBetweenAccounts')
        .mockReturnValue({});

      const result = AdminService.updateDisputeOrders({
        ...errorDataParam,
        status: DISPUTE_ORDERS.STATUS.RESOLVED,
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.INTERNAL_TRANSFER_FAILED));
    });

    // Positive scenario
    it('should successfully when admin update dispute order to in progress', async () => {
      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: orderDisputes.length,
          orders: orderDisputes,
        });
      orderDisputesDal.update.mockResolvedValue(true);
      jest
        .spyOn(NotificationEngine, 'sendNotification')
        .mockReturnValue(true);

      const params = {
        ...errorDataParam,
        notes: undefined,
      };
      const result = await AdminService.updateDisputeOrders(params);

      expect(result).toBe(`Success update order dispute from ${orderDisputes[0].status} to ${params.status} - ${orderNumber}`);
    });

    it('should successfully when admin update dispute order to revoked', async () => {
      const data = orderDisputes;
      data[0].status = DISPUTE_ORDERS.STATUS.IN_PROGRESS;

      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: data.length,
          orders: data,
        });
      listingsDal.findOne.mockResolvedValue(listings[0]);
      listingsDal.updateById.mockResolvedValue(true);
      ordersDal.update.mockResolvedValue(true);
      orderTimesDal.update.mockResolvedValue(true);
      orderDisputesDal.update.mockResolvedValue(true);
      jest
        .spyOn(NotificationEngine, 'sendNotification')
        .mockReturnValue(true);

      const params = {
        ...errorDataParam,
        status: DISPUTE_ORDERS.STATUS.REVOKED,
      };
      const result = await AdminService.updateDisputeOrders(params);

      expect(result).toBe(`Success update order dispute from ${data[0].status} to ${params.status} - ${orderNumber}`);
    });

    it('should successfully when admin update dispute order to resolved', async () => {
      const data = orderDisputes;
      data[0].status = DISPUTE_ORDERS.STATUS.IN_PROGRESS;

      jest
        .spyOn(AdminService, 'getDisputeOrders')
        .mockReturnValue({
          total: data.length,
          orders: data,
        });
      jest
        .spyOn(OrderService, 'checkP2PSubAccount')
        .mockReturnValue({
          from: { subAccountId: 'random-from-sub-account' },
          to: { subAccountId: 'random-to-sub-account' },
        });
      orderTransfersDal.create.mockResolvedValue({ id: 'random-orderTransferId' });
      jest
        .spyOn(UserSubAccountService, 'transferBetweenAccounts')
        .mockReturnValue({ txnId: 'random-txnId' });
      orderTransfersDal.updateById.mockResolvedValue(true);
      ordersDal.update.mockResolvedValue(true);
      orderTimesDal.update.mockResolvedValue(true);
      orderDisputesDal.update.mockResolvedValue(true);
      jest
        .spyOn(NotificationEngine, 'sendNotification')
        .mockReturnValue(true);

      const params = {
        ...errorDataParam,
        status: DISPUTE_ORDERS.STATUS.RESOLVED,
      };
      const result = await AdminService.updateDisputeOrders(params);

      expect(result).toBe(`Success update order dispute from ${data[0].status} to ${params.status} - ${orderNumber}`);
    });
  });

  describe('Report Functions', () => {
    describe('getUsers()', () => {
      it('should successfully get users and only return userId field', async () => {
        usersDal.findAll.mockResolvedValue(users);
        const isUserCorrect = isUser();

        const result = await AdminService.getUsers();

        expect(Array.isArray(result)).toBeTruthy();
        expect(result).toEqual(
          expect.arrayContaining(result.map(isUserCorrect)),
        );
      });
    });
  });
});
