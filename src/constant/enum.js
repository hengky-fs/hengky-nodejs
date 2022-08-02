module.exports = {
  BANK_TYPES_BY_ID: {
    1: 'BANK TRANSFER',
    2: 'DIGITAL WALLET',
  },
  BANK_TYPES: {
    BANK_TRANSFER: 1,
    DIGITAL_WALLET: 2,
  },
  ORDER_LIMIT_TIME: { // Minutes
    'ACCEPT': 15,
    'EXPIRE': 15,
    'PAY': 10,
    'RELEASE': 10,
  },
  CACHE_TABLES: {
    CRYPTO_FIAT_PRICES: 'cryptoFiatPrices',
    FIXER_PRICE: 'fixerPrice',
    BINANCE_TICKER_PRICE: 'binanceTickerPrice',
  },
};