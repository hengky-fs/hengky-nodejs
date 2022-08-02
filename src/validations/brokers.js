const Joi = require('joi');

module.exports.createMyPaymentMethod = Joi.object({
  userId: Joi.number().integer().required(),
  bankId: Joi.number().integer().required(),
  accountName: Joi.string().required(),
  accountNumber: Joi.string().required(),
  accountBeneficiary: Joi.string().allow('', null).optional(),
  ibanNumber: Joi.string().allow('', null).optional(),
});

module.exports.updateMyPaymentMethod = Joi.object({
  bankId: Joi.number().integer().allow('', null).optional(),
  accountName: Joi.string().allow('', null).optional(),
  accountNumber: Joi.string().allow('', null).optional(),
  accountBeneficiary: Joi.string().allow('', null).optional(),
  ibanNumber: Joi.string().allow('', null).optional(),
});

module.exports.activeInActiveMyPaymentMethod = Joi.object({
  id: Joi.number().integer().required(),
  userId: Joi.number().integer().required(),
  isActive: Joi.boolean().required(),
});

module.exports.internalTransfer = Joi.object({
  from: Joi.string().valid('SPOT', 'P2P').required(),
  to: Joi.string().valid('SPOT', 'P2P').required(),
  coin: Joi.string().required(),
  amount: Joi.string().required(),
});