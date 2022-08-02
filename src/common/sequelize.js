const Sequelize = require('sequelize');
const Utils  = require('./utils');
const config = require('./config');
const logger = require('./logger');

// connect to mysql
const sequelizeOptions = {
  dialect: 'mysql',
  port: config.mysql.port,
  host: config.mysql.host,
  pool: {
    max: 30,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(config.mysql.ssl && {
    ssl: config.mysql.ssl,
  }),
  logging: config.env === 'test' ? false : console.log,
};

const sequelize = new Sequelize(
  config.mysql.db,
  config.mysql.user,
  config.mysql.password,
  sequelizeOptions,
);

sequelize
  .authenticate()
  .then(async () => {
    logger.info('Successfully established connection to database');
    await Utils.fetchCryptoTickerPrice();
    await Utils.fetchFiatPairing();
  })
  .catch((err) => {
    logger.error('Unable to connect to database', err);
  });

module.exports = sequelize;
