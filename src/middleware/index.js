const validationMiddleware = require('./validation');
const rateLimit = require('./req-limit');

module.exports = {
  validationMiddleware,
  rateLimit,
};
