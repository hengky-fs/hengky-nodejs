const Joi = require('joi');

module.exports.createOrder = Joi.object({
  listingId: Joi.number().integer().required(),
  userId: Joi.number().integer().required(),
  amount: Joi.string().required(),
});

module.exports.changeOrderStatus = Joi.object({
  status: Joi.number().integer().required(),
  requestedBy: Joi.number().integer().required(),
  paymentMethod: Joi.number().integer().allow('', null).optional(),
  popKey: Joi.string().allow('', null).optional(),
});

module.exports.rejectCancelDispute = Joi.object({
  status: Joi.number().integer().required(),
  requestedBy: Joi.number().integer().required(),
  message: Joi.string().required(),
  disputeDescription: Joi.string().allow('', null).optional(),
  podKey: Joi.string().allow('', null).optional(),
});

module.exports.feedback = Joi.object({
  orderNumber: Joi.string().required(),
  requestedBy: Joi.number().integer().required(),
  requestedByName: Joi.string().required(),
  comment: Joi.string().allow('', null).optional(),
  rate: Joi.number().integer().required(),
});

module.exports.generateOrderChatUrl = Joi.object({
  requestedBy: Joi.number().integer().required(),
  orderNumber: Joi.string().required(),
});
