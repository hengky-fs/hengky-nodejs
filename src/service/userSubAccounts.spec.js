'use strict';

const { mockSequelize } = require('../tests');
mockSequelize();

const { CustomError } = require('../utils');
const { ERROR_CODES } = require('../constant');
const {
  ordersDal,
} = require('../dal');
const UserSubAccountService = require('./userSubAccounts');

// Setup mocking
jest.mock('../dal', () => ({
  ordersDal: {
    sum: jest.fn(),
  },
}));

describe('service/userSubAccounts', () => {
  beforeEach(() => {
    ordersDal.sum.mockReset();
  });

  describe('validateBalance()', () => {
    const walletAvailables = ['P2P', 'SPOT'];
    const balance = '0.001';
    const params = {
      userId: 25046,
      from: walletAvailables[Math.floor(Math.random() * walletAvailables.length)],
      coin: 'BTC',
      amount: '0.005',
    };

    it('should return cannot transfer to another wallet because of insufficient balance', async () => {
      const result = UserSubAccountService.validateBalance(balance, params);
      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.INSUFFICIENT_BALANCE));
    });

    it('should return cannot transfer from P2P wallet because of he/she has an active orders', async () => {
      ordersDal.sum.mockResolvedValue('0.0003');

      const result = UserSubAccountService.validateBalance(balance, {
        ...params,
        from: 'P2P',
        amount: '0.001',
      });

      await expect(result).rejects.toThrow(new CustomError(ERROR_CODES.SUBACCOUNT_VALIDATE_BALANCE_LOCKED_ORDERS));
    });
  });
});
