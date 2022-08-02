// This data only for mocking
exports.currencies = [
  {
    id: 8,
    name: "Rupee Pakistan",
    symbol: 'PKR',
    code: 'Rs',
    countryCode: 'PK',
  },
]

exports.bankTypes = [
  {
    id: 1,
    type: 1,
    name: 'BANK TRANSFER',
    isActive: 1,
  },
  {
    id: 2,
    type: 2,
    name: 'DIGITAL WALLET',
    isActive: 1,
  },
];

exports.banks = [
  {
    id: 1,
    type: 1,
    name: 'Habib Bank',
    isActive: 1,
    typeName: 'BANK TRANSFER'
  },
  {
    id: 4,
    type: 2,
    name: 'Easypaisa',
    isActive: 1,
    typeName: 'DIGITAL WALLET'
  },
  {
    id: 7,
    type: 2,
    name: 'Jazzcash',
    isActive: 1,
    typeName: 'DIGITAL WALLET'
  },
];

exports.paymentMethods = [
  {
    id: 1,
    userId: 25046,
    bankId: 2,
    accountName: 'Revi user account',
    accountNumber: '312765431',
    accountBeneficiary: 'Revi',
    ibanNumber: '312765531',
    isActive: 1,
    bank: this.banks[0],
  },
  {
    id: 9,
    userId: 25046,
    bankId: 4,
    accountName: 'Revi user account',
    accountNumber: '312765431',
    accountBeneficiary: null,
    ibanNumber: null,
    isActive: 1,
    bank: this.banks[1],
  },
];

exports.listings = [
  {
    id: 1,
    userId: 25046,
    brokerType: 'SELL',
    type: 'BUY',
    coin: 'BTC',
    currency: 'PKR',
    price: '4.185.269',
    amount: '0.05',
    minLimit: '0.001',
    maxLimit: '0.05',
    minLimitFiat: '4183.47',
    maxLimitFiat: '209263',
    floatingPricePercentage: null,
    paymentWindow: 10,
    message: 'Please buy this Ad',
    isActive: 1,
    isUsingBankTransfer: 1,
    isUsingDigitalWallet: 1,
    paymentMethods:{
      bankTransfers: [],
      digitalWallets: [],
    },
  },
  {
    id: 2,
    userId: 25046,
    brokerType: 'SELL',
    type: 'BUY',
    coin: 'BTC',
    currency: 'PKR',
    price: null,
    amount: '0.05',
    minLimit: '0.001',
    maxLimit: '0.05',
    minLimitFiat: null,
    maxLimitFiat: null,
    floatingPricePercentage: '100',
    paymentWindow: 10,
    message: 'Please buy this Ad',
    isActive: 1,
    isUsingBankTransfer: 1,
    isUsingDigitalWallet: 1,
    paymentMethods:{
      bankTransfers: ['Deutsche Bank A.G'],
      digitalWallets: ['JazzCash', 'Konnect by HBL', 'easypaisa'],
    },
  },
];

exports.orders = [
  {
    id: 1,
    orderNumber: '220617INV00000002',
    type: 'BUY',
    listingId: 1,
    currency: 'PKR',
    userId: 11111,
    brokerId: 25046,
    coin: 'BTC',
    paymentMethod: 1,
    paymentWindow: 10,
    amount: '0.05',
    price: null,
    fiatAmount: '196,339',
    status: 'DISPUTED',
    userStatus: 3,
    brokerStatus: 7,
    message: 'message',
    disputeDescription: 'I dispute because ....',
    popKey: 'proof-of-payment',
    podKey: 'proof-of-dispute',
  },
];

const randomDate = new Date().toISOString();
exports.orderTimes = [
  {
    id: 1,
    orderNumber: '220617INV00000002',
    requestedAt: randomDate,
    acceptedAt: randomDate,
    paidAt: randomDate,
    completedAt: null,
    rejectedAt: null,
    cancelledAt: null,
    expiredAt: null,
    disputedAt: randomDate,
  },
];

exports.orderDisputes = [
  {
    id: 1,
    orderNumber: '220617INV00000002',
    disputedBy: null,
    zendeskNumber: '10257',
    status: 'PENDING',
    actionedBy: null,
    actionedAt: null,
    resolvedBy: null,
    resolvedAt: null,
    isAutoDispute: true,
    notes: 'Auto dispute',
    order: this.orders[0],
    orderTime: this.orderTimes[0],
  },
];

exports.users = [
  { userId: 1 },
  { userId: 2 },
  { userId: 3 },
];
