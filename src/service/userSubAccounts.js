const {
  ordersDal,
  usersDal,
} = require('../dal');
const { CustomError } = require('../utils');
const { config, utils, http, logger, } = require('../common');
const { ERROR_CODES, ORDER_STATUS } = require('../constant');

class UserSubAccountService {
  static async generateSubAccount(userId) {
    const user = await usersDal.findOne({ userId });
    if (user && user.subAccountId) throw new CustomError(ERROR_CODES.SUBACCOUNT_EXISTS);

    const { timestamp, signature } = await utils.generateBinanceSignature();
    const subAccount = await http.postRequest(
      {},
      `${config.binanceApi.url}/sapi/v1/broker/subAccount?timestamp=${timestamp}&signature=${signature}`,
      { 'X-MBX-APIKEY': config.binanceApi.key }
    );

    const { response } = subAccount;
    const { subaccountId, email } = response;
    if (subAccount.ok && subaccountId) {
      const { apiKey, apiSecretKey } = await this.createApiSubAccount(subaccountId);
      const data = { subAccountId: subaccountId, email };

      if (!user) {
        await usersDal.create({
          userId,
          apiKey,
          apiSecretKey,
          ...data
        });
      } else {
        await usersDal.updateByUserId(userId, data);
      }

      logger.info(`[P2P] Success generateSubAccount - ${JSON.stringify(response)}`);
      return data;
    }

    logger.error(`[P2P] Error at generateSubAccount - ${JSON.stringify(response)}`);
    throw new CustomError(ERROR_CODES.PROCESS_ADDRRESS_FAILED);
  }

  static async createApiSubAccount(subAccountId) {
    const canTrade = 'true';
    const { timestamp, signature } = await utils.generateBinanceSignature({ subAccountId, canTrade });

    const subAccountApi = await http.postRequest({},
      `${config.binanceApi.url}/sapi/v1/broker/subAccountApi?subAccountId=${subAccountId}&canTrade=${canTrade}&timestamp=${timestamp}&signature=${signature}`,
      { 'X-MBX-APIKEY': config.binanceApi.key });

    const { response } = subAccountApi;
    if (subAccountApi.ok && response.apiKey) {
      logger.info(`[P2P] Success createApiSubAccount - ${JSON.stringify(response)}`);
      return { apiKey: response.apiKey, apiSecretKey: response.secretKey };
    }

    logger.error(`[P2P] Error at createApiSubAccount - ${JSON.stringify(response)}`);
    throw new CustomError(ERROR_CODES.PROCESS_ADDRRESS_FAILED);
  }

  static async getSubAccount(userId) {
    const user = await usersDal.findOne({ userId });
    if (!user) throw new CustomError(ERROR_CODES.SUBACCOUNT_NOT_FOUND);

    return user;
  }

  static async getWalletInfo(userId, coin) {
    const account = await usersDal.findOne({ userId });
    if (account && account.apiKey) {
      const { apiKey, apiSecretKey } = account;
      const { timestamp, signature } = await utils.generateBinanceSignature({}, true, apiSecretKey);
      const getWalletInfo = await http.getRequest(
        `${config.binanceApi.url}/sapi/v1/capital/config/getall?timestamp=${timestamp}&signature=${signature}`,
        { 'X-MBX-APIKEY': apiKey },
      );

      const { response } = getWalletInfo;
      if (getWalletInfo.ok && response) {
        const res = response.find((obj) => obj.coin === coin);
        logger.info(`[P2P] Success getWalletInfo - ${JSON.stringify(res)}`);
        return res;
      }

      logger.error(`[P2P] Error at getWalletInfo - ${JSON.stringify(response)}`);
      throw new CustomError(ERROR_CODES.PROCESS_ADDRRESS_FAILED);
    }
    throw new CustomError(ERROR_CODES.SUBACCOUNT_NOT_FOUND);
  }

  static async querySubAccount(subAccountId) {
    const { timestamp, signature } = await utils.generateBinanceSignature({ subAccountId }, true);
    const subAccount = await http.getRequest(
      `${config.binanceApi.url}/sapi/v1/broker/subAccount?subAccountId=${subAccountId}&timestamp=${timestamp}&signature=${signature}`,
      { 'X-MBX-APIKEY': config.binanceApi.key },
    );

    const { response } = subAccount;
    if (subAccount.ok && response) {
      logger.info(`[P2P] Success querySubAccount - ${JSON.stringify(response)}`);
      return response;
    }

    logger.error(`[P2P] Error at querySubAccount - ${JSON.stringify(response)}`);
    throw new CustomError(ERROR_CODES.PROCESS_ADDRRESS_FAILED);
  }

  static async getBalances(userId = '', emailSubAccount = '', coin = '') {
    let email = emailSubAccount;
    if (!email) {
      const user = await usersDal.findOne({ userId });
      if (!user){
        if (coin) {
          const coinInfo = await utils.getCoins(coin);
          const res = {
            asset: coin,
            free: 0,
            locked: 0,
            detail: coinInfo,
            [`${coin}PKR`]: 0,
          };
          if (coin !== 'USDT') res[`${coin}USDT`] = 0;

          logger.info(`[P2P] Success getBalances - ${JSON.stringify(res)}`);
          return res;
        }
        return [];
      }
      email = user.email;
    }

    const { timestamp, signature } = await utils.generateBinanceSignature({ email });
    const subAccountsAssets = await http.getRequest(
      `${config.binanceApi.url}/sapi/v3/sub-account/assets?email=${email}&timestamp=${timestamp}&signature=${signature}`,
      { 'X-MBX-APIKEY': config.binanceApi.key },
    );

    const { response } = subAccountsAssets;
    if (subAccountsAssets.ok && response) {
      const { balances } = response;
      if (coin && balances) {
        const res = balances.find((obj) => obj.asset === coin);

        const coinInfo = await utils.getCoins(coin);
        let pair = {};
        if (res) pair = await utils.convertCrypto(coin, +res.free);

        const data = {
          ...res,
          detail: coinInfo,
          [`${coin}PKR`]: pair.PKR || 0,
        };
        if (coin !== 'USDT') data[`${coin}USDT`] = pair.USDT || 0;

        logger.info(`[P2P] Success getBalances - ${JSON.stringify(data)}`);
        return data;
      }

      const availableCoins = await utils.getCoins();
      const resAll = [];
      await Promise.all(
        availableCoins.map(async (coinInfo) => {
          const { code } = coinInfo;
          const tmp = balances.find((obj) => obj.asset === code);
          if (tmp && tmp.free && +tmp.free > 0) {
            const pair = await utils.convertCrypto(code, +tmp.free);
            const data = {
              ...tmp,
              detail: coinInfo,
              [`${code}PKR`]: pair.PKR,
            };
            if (code !== 'USDT') data[`${code}USDT`] = pair.USDT;
            resAll.push(data);
          }
        })
      );

      logger.info(`[P2P] Success getBalances - ${JSON.stringify(resAll)}`);
      return resAll;
    }

    logger.error(`[P2P] Error at getBalances - ${JSON.stringify(response)}`);
    throw new CustomError(ERROR_CODES.PROCESS_ADDRRESS_FAILED);
  }

  static async transferBetweenAccounts(fromId, toId, asset, amount) {
    const clientTranId = Date.now();
    const { timestamp, signature } = await utils.generateBinanceSignature({ fromId, toId, clientTranId, asset, amount });
    const transfer = await http.postRequest(
      {},
      `${config.binanceApi.url}/sapi/v1/broker/transfer?fromId=${fromId}&toId=${toId}&clientTranId=${clientTranId}&asset=${asset}&amount=${amount}&timestamp=${timestamp}&signature=${signature}`,
      { 'X-MBX-APIKEY': config.binanceApi.key },
    );

    const response = transfer && transfer?.response ? transfer.response : undefined;
    if (!response) {
      logger.error(`[P2P] Error at transferBetweenAccounts - ${JSON.stringify(response) || transfer}`);
      throw new CustomError(ERROR_CODES.PROCESS_ADDRRESS_FAILED);
    }

    logger.info(`[P2P] Success transferBetweenAccounts - ${JSON.stringify(response)}`);
    return response;
  }

  // Validation
  static async validateBalance(balance, { amount, from, userId, coin }) {
    // Standard validation from SPOT or P2P
    if (+balance < +amount) throw new CustomError(ERROR_CODES.INSUFFICIENT_BALANCE);

    // Only from P2P
    if (from === 'P2P') {
      const totalAmountActiveOrder = await ordersDal.sum('amount', {
        type: 'BUY',
        brokerId: userId,
        coin,
        status: [
          ORDER_STATUS.STATUS.ACCEPTED,
          ORDER_STATUS.STATUS.PAID,
          ORDER_STATUS.STATUS.DISPUTED,
        ],
      });
      if ((+balance - +totalAmountActiveOrder) < +amount) throw new CustomError(ERROR_CODES.SUBACCOUNT_VALIDATE_BALANCE_LOCKED_ORDERS);
    }

    return true;
  }
}
module.exports = UserSubAccountService;
