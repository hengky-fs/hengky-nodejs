'use strict';

const { mockSequelize } = require('../tests');
mockSequelize();

const { ENUM } = require('../constant');
const {
  banks,
} = require('../tests/data');
const {
  banksDal,
} = require('../dal');
const PublicService = require('./publics');

// Setup mocking
jest.mock('../dal', () => ({
  banksDal: {
    findAllWithRelation: jest.fn(),
  },
}));

// Anonymous function for checking result of banks
const isBank = (params = {}) => (bank) => {
  const { type } = params;
  const expectedType = type || expect.any(Number);

  return expect.objectContaining({
    id: expect.any(Number),
    type: expectedType,
    name: expect.any(String),
    isActive: expect.any(Number),
    bankType: expect.objectContaining({
      id: expectedType,
      name: ENUM.BANK_TYPES_BY_ID[type] || expect.any(String),
    }),
  });
};

const newDataBanks = banks.map((b) => ({
  ...b,
  bankType: {
    id: b.type,
    name: ENUM.BANK_TYPES_BY_ID[b.type],
  }
}));

describe('service/publics', () => {
  beforeEach(() => {
    banksDal.findAllWithRelation.mockReset();
  });

  describe('getBanks()', () => {
    it('should successfully get all bank', async () => {
      banksDal.findAllWithRelation.mockResolvedValue(newDataBanks);
      const isAllBank = isBank();

      const result = await PublicService.getBanks();

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toEqual(
        expect.arrayContaining(result.map(isAllBank)),
      );
    });

    it('should successfully get banks by type', async () => {
      const types = [ENUM.BANK_TYPES.BANK_TRANSFER, ENUM.BANK_TYPES.DIGITAL_WALLET];
      const randomType = types[Math.floor(Math.random() * types.length)];
      const filteredBanks = newDataBanks.filter((b) => b.type === randomType);
      banksDal.findAllWithRelation.mockResolvedValue(filteredBanks);
      const param = { type: randomType };
      const isAllBank = isBank(param);

      const result = await PublicService.getBanks(param);

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toEqual(
        expect.arrayContaining(result.map(isAllBank)),
      );
    });
  });
});
