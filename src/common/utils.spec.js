'use strict';

const {
  mockBinanceGetTickerPrice,
  mockFixerGetPrice,
  mockCoin,
} = require('../tests/mocks');
const Utils = require('./utils');

// Anonymous function for checking object of coin
const isCoin = (params = {}) => (c) => {
  const { coin } = params;
  const coinExpectation = coin || expect.any(String);

  return expect.objectContaining({
    name: expect.any(String),
    symbol: coinExpectation,
    code: coinExpectation,
  });
};
const availableCurrencies = Utils.supportedCurrencies();

describe('common/utils', () => {
  describe('getCoins()', () => {
    it('should successfully fetch available coins', async () => {
      mockCoin();
      const isAllCoin = isCoin();

      const result = await Utils.getCoins();

      expect(Array.isArray(result)).toBeTruthy();
      expect(result).toEqual(
        expect.arrayContaining(result.map(isAllCoin)),
      );
    });

    it('should successfully fetch selected coin', async () => {
      const coin = 'BTC';
      mockCoin(coin, {
        name: 'Bitcoin',
        symbol: coin,
        code: coin,
      });
      const selectedCoin = isCoin(coin);

      const result = await Utils.getCoins(coin);

      expect(typeof result === 'object').toBeTruthy();
      [result].map(selectedCoin);
    });
  });

  describe('fetchCryptoTickerPrice()', () => {
    it('should successfully fetch binance ticker price', async () => {
      mockCoin();
      mockBinanceGetTickerPrice();
      const result = await Utils.fetchCryptoTickerPrice();
      expect(result).toBeTruthy();
    });
  });

  describe('fetchFiatPairing()', () => {
    it('should successfully fetch fixer prices', async () => {
      mockFixerGetPrice(undefined, availableCurrencies);
      const result = await Utils.fetchFiatPairing();
      expect(result).toBeTruthy();
    });
  });

  describe('convertCrypto()', () => {
    it('should successfully return USDT pairs', async () => {
      mockCoin();
      mockBinanceGetTickerPrice();
      mockFixerGetPrice(undefined, availableCurrencies);

      const coin = 'USDT';
      const amount = '150';
      const result = await Utils.convertCrypto(coin, amount);

      expect(typeof result === 'object').toBeTruthy();
      availableCurrencies.forEach((c) => {
        expect(result).toHaveProperty(c, expect.any(Number));
      });
    });

    it('should successfully return X-COIN pairs', async () => {
      mockCoin();
      mockBinanceGetTickerPrice();
      mockFixerGetPrice(undefined, availableCurrencies);

      const coin = 'BTC';
      const amount = '0.025';
      const result = await Utils.convertCrypto(coin, amount);

      const currencies = [...availableCurrencies, 'USDT'];
      expect(typeof result === 'object').toBeTruthy();
      currencies.forEach((c) => {
        expect(result).toHaveProperty(c, expect.any(Number));
      });
    });
  });
});