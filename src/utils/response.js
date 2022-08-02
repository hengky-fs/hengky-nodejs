// Applicaton common response handler

const CustomError = require('./error');
const logger = require('../common/logger');

const responseHandler = (data) => {
  const {
    response, message, result, code = 200, errors = null, isSuccess = true,
  } = data;
  return response.status(code).json({
    code,
    errors,
    message,
    result,
    isSuccess,
  });
};

const requestHelper = (request) => {
  if (request.body) {
    if (request.body.password) {
      delete request.body.password;
    }
    return request.body;
  }
  return 'noBody';
};

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, request, response, next) => {
  const originalError = err;
  if (!(err instanceof CustomError)) {
    if (err instanceof Error) {
      err = new CustomError({
        message: err.message,
      });
    }
  }
  const userId = !request.loggedUser ? 0 : request.loggedUser.id;
  logger.log('error', `URL: ${request.url} - ID:${userId} `, { meta: { error: originalError.stack, body: requestHelper(request) } });
  return responseHandler({
    response,
    message: err.message,
    result: null,
    code: err.code || 500,
    errors: [err],
    isSuccess: false,
  });
};

module.exports = {
  responseHandler,
  globalErrorHandler,
};
