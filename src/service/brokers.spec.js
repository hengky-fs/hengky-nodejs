'use strict';

const { mockSequelize } = require('../tests');
mockSequelize();

const {
  bankTypes,
  banks,
  paymentMethods,
} = require('../tests/data');
const {
  brokerPaymentMethodsDal,
  bankTypesDal,
  banksDal,
  listingsDal,
  ordersDal,
} = require('../dal');
const { ERROR_CODES, ENUM } = require('../constant');
const { CustomError } = require('../utils');
const BrokerService = require('./brokers');

// Setup mocking
jest.mock('../dal', () => ({
  brokerPaymentMethodsDal: {
    findAllWithRelation: jest.fn(),
    findAll: jest.fn(),
    findOneWithRelation: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    count: jest.fn(),
  },
  bankTypesDal: {
    findAll: jest.fn(),
    findOne: jest.fn(),
  },
  banksDal: {
    findAll: jest.fn(),
    findOneWithRelation: jest.fn(),
  },
  listingsDal: {
    count: jest.fn(),
  },
  ordersDal: {
    count: jest.fn(),
  },
}));

// Initialize data for mocking
const brokerId = 25046;
const paymentMethodId = 9;

// Anonymous function for checking result of payment method
const isPaymentMethod = (params = {}) => (paymentMethod) => {
  const { isActive, userId, id } = params;

  const result = {};
  if (isActive !== undefined) result.isActive = isActive;

  return expect.objectContaining({
    id: id || expect.any(Number),
    userId: userId || expect.any(Number),
    bank: expect.objectContaining({
      id: expect.any(Number),
      isActive: expect.any(Number),
      name: expect.any(String),
      type: expect.any(Number),
      typeName: expect.stringMatching(/BANK TRANSFER|DIGITAL WALLET/),
    }),
    accountName: expect.any(String),
    accountNumber: expect.any(String),
    accountBeneficiary: paymentMethod.accountBeneficiary ? expect.any(String) : null,
    ibanNumber: paymentMethod.ibanNumber ? expect.any(String) : null,
    ...result,
  });
};

describe('service/brokers.integration', () => {
  beforeEach(() => {
    brokerPaymentMethodsDal.findAllWithRelation.mockReset();
    brokerPaymentMethodsDal.findAll.mockReset();
    brokerPaymentMethodsDal.findOneWithRelation.mockReset();
    brokerPaymentMethodsDal.findOne.mockReset();
    brokerPaymentMethodsDal.create.mockReset();
    brokerPaymentMethodsDal.updateById.mockReset();
    brokerPaymentMethodsDal.count.mockReset();
    bankTypesDal.findAll.mockReset();
    bankTypesDal.findOne.mockReset();
    banksDal.findAll.mockReset();
    banksDal.findOneWithRelation.mockReset();
    listingsDal.count.mockReset();
    ordersDal.count.mockReset();
  });

  describe('getMyPaymentMethod()', () => {
    it('should successfully get all my payment methods', async () => {
      brokerPaymentMethodsDal.findAllWithRelation.mockResolvedValue(paymentMethods);
      bankTypesDal.findAll.mockResolvedValue(bankTypes);

      // Given
      const isAllMyPaymentMethod = isPaymentMethod({ userId: brokerId });

      // When
      const result = await BrokerService.getMyPaymentMethod({ userId: brokerId }, {});

      // Then
      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toEqual(
        expect.arrayContaining(result.map(isAllMyPaymentMethod)),
      );
    });

    it('should successfully get active payment methods by userId', async () => {
      brokerPaymentMethodsDal.findAllWithRelation.mockResolvedValue(paymentMethods);
      bankTypesDal.findAll.mockResolvedValue(bankTypes);

      // Given
      const isActive = true;
      const isActiveDb = isActive === true ? 1 : 0;
      const isAllMyPaymentMethod = isPaymentMethod({
        isActive: isActiveDb,
        userId: brokerId,
      });

      // When
      const result = await BrokerService.getMyPaymentMethod({ userId: brokerId }, { isActive });

      // Then
      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toEqual(
        expect.arrayContaining(result.map(isAllMyPaymentMethod)),
      );
    });
  });

  describe('getMyPaymentMethodById()', () => {
    it('should successfully get my payment method by id', async () => {
      brokerPaymentMethodsDal.findOneWithRelation.mockResolvedValue(paymentMethods[1]);
      bankTypesDal.findOne.mockResolvedValue(bankTypes[1]);

      const param = { id: paymentMethodId, userId: brokerId };
      const isMyPaymentMethod = isPaymentMethod(param);

      const result = await BrokerService.getMyPaymentMethodById(param);

      expect(typeof result === 'object').toBeTruthy();
      [result].map(isMyPaymentMethod)
    });

    it('should return payment method not found', async () => {
      brokerPaymentMethodsDal.findOneWithRelation.mockResolvedValue(undefined);
      bankTypesDal.findOne.mockResolvedValue(bankTypes[1]);

      const result = BrokerService.getMyPaymentMethodById({
        id: 0,
        userId: brokerId,
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.PAYMENT_METHOD_NOT_FOUND));
    });
  });

  describe('createMyPaymentMethod()', () => {
    describe('for bank transfer', () => {
      it('should successfully create active payment method for bank transfer without triggering any listing', async () => {
        const bankTransfers = banks.filter((b) => b.type === ENUM.BANK_TYPES.BANK_TRANSFER);

        // Get bank transfer detail first
        const bank = banks[0];
        const param = {
          userId: brokerId,
          bankId: bank.id,
          accountName: 'Account name',
          accountNumber: 'Account number',
          accountBeneficiary: 'Beneficiary name',
          ibanNumber: 'Iban number',
        };
        const expectedResult = {
          ...param,
          isActive: true,
        };

        // Mocking
        brokerPaymentMethodsDal.findOne.mockResolvedValue(undefined);
        banksDal.findOneWithRelation.mockResolvedValue({
          ...banks[0],
          bankType: bankTypes[0],
        });
        banksDal.findAll.mockResolvedValue(bankTransfers);
        brokerPaymentMethodsDal.findAll.mockResolvedValue([]);
        brokerPaymentMethodsDal.create.mockResolvedValue(expectedResult);
        listingsDal.count.mockResolvedValue(0);

        // Testing execution
        const result = await BrokerService.createMyPaymentMethod(param);

        // Expectations
        expect(typeof result === 'object').toBeTruthy();
        expect(result).toMatchObject(expectedResult);
      });

      it('should return broker only can have one bank transfer type', async () => {
        const bankTransfers = banks.filter((b) => b.type === 2);

        // Get bank transfer detail first
        const bank = banks[0];
        const param = {
          userId: brokerId,
          bankId: bank.id,
          accountName: 'Account name',
          accountNumber: 'Account number',
          accountBeneficiary: 'Beneficiary name',
          ibanNumber: 'Iban number',
        };

        // Mocking
        brokerPaymentMethodsDal.findOne.mockResolvedValue(undefined);
        banksDal.findOneWithRelation.mockResolvedValue({
          ...banks[0],
          bankType: bankTypes[0],
        });
        banksDal.findAll.mockResolvedValue(bankTransfers);
        brokerPaymentMethodsDal.findAll.mockResolvedValue([paymentMethods[0]]);

        // Testing execution
        const result = BrokerService.createMyPaymentMethod(param);

        // Expectations
        await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.PAYMENT_METHOD_BT_ONLY_ONE));
      });
    });

    describe('for digital wallet', () => {
      const param = {
        userId: brokerId,
        bankId: null,
        accountName: 'Fullname',
        accountNumber: 'Phone number',
        accountBeneficiary: null,
        ibanNumber: null,
      };

      it('should successfully create active payment method for digital wallet without triggering any listing', async () => {
        // Get digital wallet detail first
        const bank = banks[2];
        const bankId = bank.id;
        const expectedResult = {
          ...param,
          bankId,
          isActive: true,
        }

        // Mocking
        brokerPaymentMethodsDal.findOne.mockResolvedValue(undefined);
        banksDal.findOneWithRelation.mockResolvedValue({
          ...banks[2],
          bankType: bankTypes[1],
        });
        brokerPaymentMethodsDal.create.mockResolvedValue(expectedResult);
        listingsDal.count.mockResolvedValue(0);

        // Testing execution
        const result = await BrokerService.createMyPaymentMethod({
          ...param,
          bankId,
        });

        // Expectations
        expect(typeof result === 'object').toBeTruthy();
        expect(result).toMatchObject(expectedResult);
      });

      it('should return payment method is exists', async () => {
        brokerPaymentMethodsDal.findOne.mockResolvedValue(paymentMethods[1]);

        // Get digital wallet that already exists
        const bank = banks[2];

        const result = BrokerService.createMyPaymentMethod({
          ...param,
          bankId: bank.id,
        });

        await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.PAYMENT_METHOD_EXISTS));
      });
    });
  });

  describe('updateMyPaymentMethod()', () => {
    it('should successfully update payment method', async () => {
      brokerPaymentMethodsDal.findOneWithRelation.mockResolvedValue(paymentMethods[1]);
      bankTypesDal.findOne.mockResolvedValue(bankTypes[1]);
      brokerPaymentMethodsDal.updateById.mockResolvedValue(true);
      listingsDal.count.mockResolvedValue(0);

      const queryParam = {
        id: 9,
        userId: brokerId,
      };
      const dataParam = {
        accountName: 'Account name test update',
        accountNumber: 'Account number test update',
      };

      const result = await BrokerService.updateMyPaymentMethod(queryParam, dataParam);

      expect(result).toBe('Success update payment method!');
    });
  });

  describe('activeInActiveMyPaymentMethod()', () => {
    const dataParam = {
      id: 9,
      userId: brokerId,
      isActive: false,
    };

    it('should successfully activate payment method', async () => {
      brokerPaymentMethodsDal.findOneWithRelation.mockResolvedValue(paymentMethods[1]);
      bankTypesDal.findOne.mockResolvedValue(bankTypes[1]);
      brokerPaymentMethodsDal.updateById.mockResolvedValue(true);
      listingsDal.count.mockResolvedValue(0);

      const isActive = true;
      const result = await BrokerService.activeInActiveMyPaymentMethod({
        ...dataParam,
        isActive,
      });

      expect(result).toBe(`Success ${isActive ? 'activate' : 'inactivate'} payment method!`);
    });

    it('should return errror because have active order', async () => {
      brokerPaymentMethodsDal.count.mockResolvedValue(1);
      ordersDal.count.mockResolvedValue(1);
      const result = BrokerService.activeInActiveMyPaymentMethod(dataParam);
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.INACTIVE_PAYMENT_METHOD_FAILED_BECAUSE_ACTIVE_ORDER));
    });

    it('should return errror because have active Ad (SELL)', async () => {
      brokerPaymentMethodsDal.count.mockResolvedValue(1);
      ordersDal.count.mockResolvedValue(0);
      listingsDal.count.mockResolvedValue(1);
      const result = BrokerService.activeInActiveMyPaymentMethod(dataParam);
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.INACTIVE_PAYMENT_METHOD_FAILED_BECAUSE_ACTIVE_LISTING));
    });
  });
});