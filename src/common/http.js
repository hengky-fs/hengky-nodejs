/* eslint-disable no-use-before-define */
const fetch = require('node-fetch');
const http = require('http');
const https = require('https');
const logger = require('./logger');

const httpAgent = (parsedUrl) => {
  const options = {
    keepAlive: true,
  };

  if (parsedUrl && parsedUrl.protocol === 'https:') {
    return new https.Agent(options);
  }

  return new http.Agent(options);
};

/**
 * post request
 * @param reqBody
 * @param apiUrl
 * @param headers
 * @returns {Promise<*>}
 */
const postRequest = async (reqBody, apiUrl, headers = {}) => {
  logger.info(`POST: Remote api call: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'post',
    body: JSON.stringify(reqBody),
    compress: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip,deflate',
      ...headers,
    },
    agent: httpAgent,
  });

  return responseParseAsJson(apiUrl, response);
};
/**
 * get request
 * @param apiUrl
 * @param headers
 * @returns {Promise<*>}
 */
const getRequest = async (apiUrl, headers = {}) => {
  logger.info(`GET: Remote api call: ${apiUrl}`);

  const response = await fetch(apiUrl, {
    method: 'get',
    compress: true,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip,deflate',
      ...headers,
    },
    agent: httpAgent,
  });

  return responseParseAsJson(apiUrl, response);
};

/**
 * parse response json and handle error
 * @param apiUrl
 * @param response
 * @returns {null|*}
 */
const responseParseAsJson = async (apiUrl, response) => {
  try {
    return {
      response: await response.json(),
      status: response.status,
      ok: response.ok,
    };
  } catch (error) {
    logger.log(
      'error',
      `Error occurred, apiUrl: ${apiUrl}, apiStatus: ${response.statusText}`,
      { headers: response.headers.raw(), error: error.stack },
    );
  }

  return null;
};

module.exports = {
  postRequest,
  getRequest,
};
