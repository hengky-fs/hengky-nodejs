function listingNotFound(id) {
  return {
    code: 404,
    message: `Listing with id: ${id}, not found!`,
  }
}

function orderNotFound(orderNumber) {
  return {
    code: 404,
    message: `Order with number: ${orderNumber}, not found!`,
  }
}

function orderExpired(orderNumber) {
  return {
    code: 404,
    message: `This order: ${orderNumber} is expired, please create order again!`,
  }
}

function accountNumberExists(accountNumber) {
  return {
    code: 403,
    message: `This accountNumber: ${accountNumber} is exists!`,
  }
}

module.exports = {
  listingNotFound,
  orderNotFound,
  orderExpired,
  accountNumberExists,
  UNAUTHORIZED: {
    code: 401,
    message: `Unauthorized user!`,
  },
  DATA_NOT_EXISTS: {
    code: 404,
    message: `Data not exists!`,
  },
  DATA_EXISTS: {
    code: 403,
    message: `Data already exists!`,
  },
  REQUEST_ORDER_FAILED: {
    code: 400,
    message: `Request order failed, there's server issue, please call CS!`,
  },
  REQUEST_ORDER_FAILED_INACTIVE: {
    code: 400,
    message: 'Request order failed, the seller already offline!',
  },
  REQUEST_ORDER_FAILED_INSUFFICIENT_BALANCE: {
    code: 400,
    message: 'Insufficient balance!',
  },
  REQUEST_ORDER_FAILED_NO_PAYMENT_METHOD_SETUP: {
    code: 400,
    message: 'Please set up your payment method first!',
  },
  REQUEST_ORDER_FAILED_MINLIMIT: {
    code: 400,
    message: 'The amount is lower than minimum limit!',
  },
  REQUEST_ORDER_FAILED_SAME_USER: {
    code: 400,
    message: 'Request order failed, user cannot buy or sell own ads!',
  },
  GIVE_FEEDBACK_FAILED_NOT_COMPLETED: {
    code: 400,
    message: 'Give feedback failed, the order is not completed!',
  },
  INVALID_DATE_FORMAT: {
    code: 400,
    message: 'Invalid date format!',
  },
  PAYMENT_METHOD_REQUIRED: {
    code: 400,
    message: 'Payment Method Required!',
  },
  PAYMENT_METHOD_NOT_FOUND: {
    code: 400,
    message: 'Payment Method not found!',
  },
  PAYMENT_METHOD_EXISTS: {
    code: 400,
    message: 'Payment Method is exists!',
  },
  PAYMENT_METHOD_BT_ONLY_ONE: {
    code: 400,
    message: 'Sorry, currently broker only can have one bank transfer type!',
  },
  INACTIVE_PAYMENT_METHOD_FAILED_BECAUSE_ACTIVE_ORDER: {
    code: 400,
    message: 'You cannot inactive payment method because you have active order(Requested or Accepted)!',
  },
  INACTIVE_PAYMENT_METHOD_FAILED_BECAUSE_ACTIVE_LISTING: {
    code: 400,
    message: 'You cannot inactive payment method because you have active ads(SELL)!',
  },
  LISTING_FAILED_TO_UPDATE_BECAUSE_HAS_ACTIVE_ORDER: {
    code: 400,
    message: 'Sorry! You cannot change this Ad until the Active Order (accepted & paid) of this Ad is Completed!',
  },
  PROCESS_ORDER_FAILED: {
    code: 400,
    message: `Process order failed, there's server issue, please call CS!`,
  },
  FILE_EXT_NOT_ALLOWED: {
    code: 400,
    message: 'File extension not allowed',
  },
  SUBACCOUNT_EXISTS: {
    code: 400,
    message: 'Sub account is exists!',
  },
  SUBACCOUNT_NOT_FOUND: {
    code: 404,
    message: 'Sub account not found!',
  },
  SUBACCOUNT_VALIDATE_BALANCE_LOCKED_ORDERS: {
    code: 404,
    message: 'Sorry! The amount of coins you are trying to transfer are currently locked to your orders. Please transfer more coins before proceeding!',
  },
  PROCESS_ADDRRESS_FAILED: {
    code: 400,
    message: `Process address failed, please try again!`
  },
  INTERNAL_TRANSFER_FAILED: {
    code: 400,
    message: 'Internal transfer failed!'
  },
  UNVERIFIED: {
    code: 400,
    message: 'Unverified user, please complete your kyc!'
  },
  INSUFFICIENT_BALANCE: {
    code: 400,
    message: 'Insufficient balance!',
  },
  BAD_REQUEST: {
    code: 400,
    message: 'Bad Request!'
  },
};
