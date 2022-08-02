const express = require('express');

const { http, config } = require('../common');

const statusRouter = express.Router();

statusRouter.get('/ip', async (req, res) => {
  const { response } = await http.getRequest('http://ip-api.com/json');
  res.json(response);
});
statusRouter.get('/health', async (req, res) => {
  res.json({
    env: config.env,
    apiVersion: config.apiVersion,
    status: true
  });
});

module.exports = statusRouter;
