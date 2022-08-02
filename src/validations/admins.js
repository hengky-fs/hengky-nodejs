const Joi = require('joi');

module.exports.createBankTypes = Joi.object({
  name: Joi.string().required(),
  isActive: Joi.bool().required(),
});

module.exports.updateBankTypes = Joi.object({
  name: Joi.string().optional(),
  isActive: Joi.bool().optional(),
});

module.exports.createBanks = Joi.object({
  type: Joi.number().integer().required(),
  name: Joi.string().required(),
  isActive: Joi.bool().required(),
});

module.exports.updateBanks = Joi.object({
  type: Joi.number().integer().optional(),
  name: Joi.string().optional(),
  isActive: Joi.bool().optional(),
});

module.exports.createDisputeReasons = Joi.object({
  type: Joi.number().integer().required(),
  reason: Joi.string().max(255).required(),
  isActive: Joi.bool().required(),
});

module.exports.updateDisputeReasons = Joi.object({
  type: Joi.number().integer().optional(),
  reason: Joi.string().max(255).optional(),
  isActive: Joi.bool().optional(),
});

module.exports.updateDisputeOrders = Joi.object({
  adminId: Joi.number().integer().required(),
  status: Joi.string().valid('PENDING', 'IN_PROGRESS', 'RESOLVED', 'REVOKED').required(),
  notes: Joi.string().optional(),
});

module.exports.updateNotesDisputeOrders = Joi.object({
  adminId: Joi.number().integer().required(),
  notes: Joi.string().required(),
});

module.exports.orderDisputeChangeAssigner = Joi.object({
  targetAdminId: Joi.number().integer().required(),
  adminId: Joi.number().integer().required(),
});
