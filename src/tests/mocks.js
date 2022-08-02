const nock = require('nock');
const config = require('../common/config');

// 3rd Party
exports.mockBinanceGetTickerPrice = (response = undefined) => {
  const res = [
    {
      symbol: 'BTCUSDT',
      price: '21748.89000000'
    },
    {
      symbol: 'ETHUSDT',
      price: '1165.00000000'
    },
  ];

  nock(config.binanceApi.url)
    .persist()
    .get('/api/v3/ticker/price')
    .reply(200, response || res);
};

exports.mockFixerGetPrice = (response = undefined, availableCurrencies = ['PKR']) => {
  const currencies = availableCurrencies.toString();
  const res = {
    success: true,
    timestamp: 1653238143,
    base: 'USD',
    date: '2022-05-22',
    rates: {},
  };

  if (!response) {
    availableCurrencies.forEach((c) => {
      res.rates[c] = Math.random() * 4;
    });
  }

  nock(config.fixer.apiUrl)
    .persist()
    .get(`/api/latest?access_key=${config.fixer.accessKey}&base=USD&symbols=${currencies}`)
    .reply(200, response || res);
};

exports.mockCurrencies = (symbol, currencyInfo) => {
  const defaultResponse = {
    code: 200,
    errors: null,
    result: [
      {
        id: 8,
        name: "Rupee Pakistan",
        symbol: "PKR",
        code: "Rs",
        countryCode: "PK",
      },
    ],
    isSuccess: true,
  };

  let path = '/p2p/publics/currencies';
  if (symbol) {
    path = `${path}/${symbol}`;
    defaultResponse.result = {
      ...currencyInfo,
      symbol,
    };
  }

  nock(config.faeApiUrl)
    .persist()
    .get(path)
    .reply(200, defaultResponse);
};

exports.mockCoin = (coin, coinInfo) => {
  const defaultResponse = {
    code: 200,
    errors: null,
    result: [
      {
        name: 'Tether',
        symbol: 'USDT',
        code: 'USDT',
      },
      {
        name: 'Bitcoin',
        symbol: 'BTC',
        code: 'BTC',
      },
    ],
    isSuccess: true,
  };

  let path = '/p2p/publics/coins';
  if (coin) {
    path = `${path}/${coin}`;
    defaultResponse.result = {
      ...coinInfo,
      code: coin,
    };
  }

  nock(config.faeApiUrl)
    .persist()
    .get(path)
    .reply(200, defaultResponse);
};

exports.mockUser = (userId) => {
  const defaultResponse = {
    code: 200,
    errors: null,
    result: [
      {
        id: userId,
        name: '',
        email: 'reviart18@gmail.com',
        phone: '6285212351576',
        legalName: 'Risjad M R',
        userType: 'mobile',
        jurisdiction: 'PK',
        country: 'PK',
        referId: '',
        currency: 6,
        apCode: null,
        isTourCompleted: 0,
        isApEnabled: 0,
        timezone: null,
        isKycApproved: 1,
        signUpVia: 'EMAIL',
        is2faEnabled: 1,
        isGAuthEnabled: 1,
        isGAuthVerified: 1,
        isSMSEnabled: 1,
        isWithdrawalAddressEnabled: null,
        isActive: 1,
        isPhoneVerified: null,
        phoneUpdatedAt: null,
        isEmailVerified: 1,
        kycStage: 1,
      },
    ],
    isSuccess: true,
  };

  nock(config.faeApiUrl)
    .persist()
    .get(`/p2p/brokers/simpleProfile/${userId}`)
    .reply(200, defaultResponse);
};
