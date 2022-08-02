const Joi = require('joi');

module.exports.create = Joi.object({
  userId: Joi.number().integer().required(),
  brokerType: Joi.string().valid('BUY', 'SELL').required(),
  coin: Joi.string().required(),
  currency: Joi.string().required(),
  price: Joi.string().allow('', null).optional(),
  amount: Joi.string().required(),
  minLimit: Joi.string().required(),
  maxLimit: Joi.string().required(),
  floatingPricePercentage: Joi.string().allow('', null).optional(),
  paymentWindow: Joi.number().integer().required(), // In minutes
  message: Joi.string().allow('', null).optional(),
});

module.exports.update = Joi.object({
  userId: Joi.number().integer().required(),
  brokerType: Joi.string().valid('BUY', 'SELL').allow('', null).optional(),
  coin: Joi.string().allow('', null).optional(),
  currency: Joi.string().allow('', null).optional(),
  price: Joi.string().allow('', null).optional(),
  amount: Joi.string().allow('', null).optional(),
  minLimit: Joi.string().allow('', null).optional(),
  maxLimit: Joi.string().allow('', null).optional(),
  floatingPricePercentage: Joi.string().allow('', null).optional(),
  paymentWindow: Joi.number().integer().allow('', null).optional(), // In minutes
  message: Joi.string().allow('', null).optional(),
});

module.exports.status = Joi.object({
  listingId: Joi.number().integer().required(),
  userId: Joi.number().integer().required(),
  isActive: Joi.boolean().required(),
});
