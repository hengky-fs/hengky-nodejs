const {
  banksDal,
} = require('../dal');
const {
  bankTypes,
} = require('../models');
const { RedisCache } = require('../utils');
const { utils, config, http } = require('../common');

class PublicService {
  static async getBanks({ type } = {}) {
    const tableName = 'banks';
    const key = 'all';

    let banks = await RedisCache.hget(tableName, key);
    if (!banks) {
      banks = await banksDal.findAllWithRelation(
        {
          where: { isActive: true },
          order: [[ 'name', 'ASC' ]],
        },
        {
          model: bankTypes,
          as: 'bankType',
          attributes: { exclude: ['isActive', 'createdAt', 'updatedAt'] },
        },
      );
      await RedisCache.hmset(tableName, key, banks);
    }

    // Filters
    if (type) banks = banks.filter((b) => b.type === +type);

    return banks;
  }

  static async getCurrencies(symbol) {
    let url = `${config.faeApiUrl}/p2p/publics/currencies`;
    if (symbol) url = `${url}/${symbol}`;

    const { response } = await http.getRequest(url);
    utils.checkErrorExists(response);

    return response.result;
  }

  static async getCurrenciesMap() {
    const currencies = {};
    const currenciesTmp = await this.getCurrencies();
    currenciesTmp.forEach((c) => {
      if (!currencies[c.symbol]) currencies[c.symbol] = c;
    });

    return currencies;
  }

  static async getCoinPrices() {
    const coins = await utils.getCoins();

    await Promise.all(
      coins.map(async ({code}, i) => {
        coins[i].prices = await utils.convertCrypto(code, 1) || {};
      })
    );
    return coins;
  }

  static async getPmButtons() {
    const tableName = 'pmButtons';
    const key = 'all';

    let banksTmp = await RedisCache.hget(tableName, key);
    if (!banksTmp) {
      banksTmp = await banksDal.findAll({
        where: { isActive: true, type: 2 },
        order: [[ 'name', 'ASC' ]],
      });
      await RedisCache.hmset(tableName, key, banksTmp);
    };

    // type = 2 is digital wallet
    const banks = [{
      type: 1,
      name: 'Bank Transfer',
    }];
    banksTmp.forEach((bank) => banks.push(bank));

    return banks;
  }
}
module.exports = PublicService;
