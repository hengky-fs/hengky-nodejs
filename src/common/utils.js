const { createHmac } = require('crypto');

const { ERROR_CODES, ENUM, } = require('../constant');
const config = require('./config');
const logger = require('./logger');
const http = require('./http');
const { CustomError, RedisCache } = require('../utils');

class Utils {
  // Helpers
  static replaceError(errKey, errValue) {
    if (errValue instanceof Error) {
      const error = {};
      let keys;
      // get own property name will help in traversing inherited properties
      keys = Object.getOwnPropertyNames(errValue);
      if (keys) {
        for (let i = 0; i < keys.length; i += 1) {
          error[keys[i]] = errValue[keys[i]];
        }
      }
      // free mem-leak
      keys = null;
      return error;
    }

    return errValue;
  }

  static checkDateFormat(stringDate, len) {
    if (stringDate.length !== len) return false;
    if (!new Date(stringDate)) return false;
    return true;
  }

  static getDateParams(startAt, endAt) {
    const today = new Date();
    let start = today;
    let end = today;

    if (!startAt || ['undefined', undefined, null].includes(startAt)) {
      start.setHours(0, 0, 0, 0);
    } else {
      start = `${startAt} 00:00:00`;
      const isDateFormatTrue = this.checkDateFormat(start, 19);
      if (!isDateFormatTrue) throw new CustomError(ERROR_CODES.INVALID_DATE_FORMAT);
    }
    if (!endAt || ['undefined', undefined, null].includes(endAt)) {
      end.setHours(0, 0, 0, 0);
    } else {
      end = `${endAt} 23:59:59`;
      const isDateFormatTrue = this.checkDateFormat(end, 19);
      if (!isDateFormatTrue) throw new CustomError(ERROR_CODES.INVALID_DATE_FORMAT);
    }

    return { start, end };
  }

  static getUrl(key) {
    return `${config.s3.endpoint}/${config.s3.bucketName}/${key}`;
  }

  static makeQueryString(q) {
    return Object.keys(q)
      .reduce((a, k) => {
        if (Array.isArray(q[k])) {
          q[k].forEach((v) => {
            a.push(`${k}=${v}`);
          });
        } else if (q[k] !== undefined) {
          a.push(`${k}=${q[k]}`);
        }
        return a;
      }, [])
      .join('&');
  }

  // Additional Functions
  static async generateBinanceSignature(parameters = {}, userSecret = false, userSecretKey) {
    const ts = Date.now();
    let binanceApiSecret = config.binanceApi.secret;
    if (userSecret) binanceApiSecret = userSecretKey;

    const result = {
      timestamp: ts - 2000,
      signature: '',
    };
    parameters.timestamp = ts - 2000;

    if (binanceApiSecret) {
      const signature = createHmac('sha256', binanceApiSecret).update(this.makeQueryString(parameters)).digest('hex');
      result.signature = signature;
    }
    return result;
  }

  static checkErrorExists(response) {
    if (response.errors || (response.code && ![200, 201].includes(response.code))) {
      throw new CustomError({
        code: response.code,
        message: response.message,
      });
    }
  }

  static async getCoins(coin) {
    // For publics/coins -> We already set cache in FAE-API
    let url = `${config.faeApiUrl}/p2p/publics/coins`;
    if (coin) url = `${url}/${coin}`;

    const { response } = await http.getRequest(url);
    this.checkErrorExists(response);

    const { result } = response;
    if (coin) {
      result.code = result.symbol;
    } else {
      result.forEach((res, i) => { result[i].code = res.symbol; })
    }

    return result;
  }

  static async fetchCryptoTickerPrice() {
    // GET crypto prices from binance because our 3rd party is binance
    const binancePriceUrl = `${config.binanceApi.url}/api/v3/ticker/price`;
    const binancePriceRes = await http.getRequest(binancePriceUrl, { 'X-MBX-APIKEY': config.binanceApi.key });

    // SET COINS to USDT rates
    const binancePrice = binancePriceRes.response;
    if (binancePrice && binancePrice.length > 0) {
      // GET coins
      const availableCoins = await this.getCoins();
      await RedisCache.hmset(ENUM.CACHE_TABLES.BINANCE_TICKER_PRICE, 'binanceTickerPrice', binancePrice);

      await Promise.all(
        availableCoins.map(async ({ code }) => {
          const data = binancePrice.find(({ symbol }) => symbol === `${code}USDT`);
          if (data) await RedisCache.hmset(ENUM.CACHE_TABLES.CRYPTO_FIAT_PRICES, data.symbol, data.price);
        })
      );
    } else {
      logger.error(`BINANCE | Failed fetch ticker price: ${JSON.stringify(binancePriceRes)}`);
    }

    return true;
  }

  static async fetchFiatPairing(currencies = []) {
    if (!currencies || currencies.length < 1) currencies = this.supportedCurrencies();

    // GET currencies rates from fixer
    const currenciesToString = currencies.toString();
    const fixerPriceUrl = `${config.fixer.apiUrl}/api/latest?access_key=${config.fixer.accessKey}&base=USD&symbols=${currenciesToString}`;
    const fixerPriceRes = await http.getRequest(fixerPriceUrl);

    // SET USDT to currencies rates
    const fixerPrice = fixerPriceRes.response;
    if (fixerPrice.success) {
      await RedisCache.hmset(ENUM.CACHE_TABLES.FIXER_PRICE, 'fixerPrice', fixerPrice);
      await Promise.all(
        currencies.map(async (c) => {
          await RedisCache.hmset(ENUM.CACHE_TABLES.CRYPTO_FIAT_PRICES, `USDT${c}`, fixerPrice.rates[c]);
        })
      );
    } else {
      logger.error(`FIXER | Failed fetch usd to ${currenciesToString}: ${JSON.stringify(fixerPriceRes)}`);
    }

    return true;
  }

  static async convertCrypto(coin, amount) {
    const currencies = this.supportedCurrencies();
    amount = +amount;

    // USDT to supported currencies
    const usdtResult = {};
    await Promise.all(
      currencies.map(async (c) => {
        const usdtToCurrency = await RedisCache.hget(ENUM.CACHE_TABLES.CRYPTO_FIAT_PRICES, `USDT${c}`);
        if (!usdtToCurrency) {
          logger.error(`Utils - convertCrypto() | Failed to fetch USDT${c} from cache`);
        }
        usdtResult[c] = usdtToCurrency * amount;
      })
    );
    if (coin === 'USDT') return usdtResult;

    // Specific crypto to USDT & supported currencies
    const coinToUsdt = await RedisCache.hget(ENUM.CACHE_TABLES.CRYPTO_FIAT_PRICES, `${coin}USDT`);
    if (!coinToUsdt) {
      logger.error(`Utils - convertCrypto() | Failed to fetch ${coin}USDT from cache`);
    }
    const coinToUsdtRes = coinToUsdt * amount;
    const specificCoinResult = { USDT: coinToUsdtRes };
    Object.keys(usdtResult).forEach((c) => {
      specificCoinResult[c] = coinToUsdtRes * usdtResult[c];
    });

    return specificCoinResult;
  }

  static supportedCurrencies() {
    const val = config.supportedCurrencies;
    const currencies = val ? val.split(',') : ['PKR'];
    return currencies.map((sc) => sc.toUpperCase());
  }
}
module.exports = Utils;
