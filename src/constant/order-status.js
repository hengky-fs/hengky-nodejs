// PLEASE DO NOT REMOVE THE STATUS CODE!

module.exports = {
  STATUS_BY_ID: {
    1: 'REQUESTED',
    2: 'ACCEPTED',
    3: 'PAID',
    4: 'COMPLETED',
    5: 'REJECTED',
    6: 'EXPIRED',
    7: 'DISPUTED',
    8: 'CANCELLED',
  },
  STATUS: {
    'REQUESTED': 1,
    'ACCEPTED': 2,
    'PAID': 3,
    'COMPLETED': 4,
    'REJECTED': 5,
    'EXPIRED': 6,
    'DISPUTED': 7,
    'CANCELLED': 8,
  },
  BUYER: {
    'REQUESTED': 1,
    'PAID': 3,
    'COMPLETED': 4,
    'DISPUTED': 7,
    'CANCELLED': 8,
  },
  SELLER: {
    'ACCEPTED': 2,
    'COMPLETED': 4,
    'REJECTED': 5,
    'DISPUTED': 7,
    'CANCELLED': 8,
  },
};