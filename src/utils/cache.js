// Redis Utils
const cacheClient = require('async-redis');
const config = require('../common/config');
const logger = require('../common/logger');

const { redis } = config;
const client = cacheClient.createClient({
  host: redis.host,
  port: redis.port,
});

client.on('error', (err) => {
  logger.error(`cache error : ${err}`);
});

client.on('ready', () => {
  logger.info('cache is ready');
});

class RedisCache {
  static set(moduleName, key, value) {
    try {
      if (typeof value !== 'string') {
        client.set(moduleName + key, JSON.stringify(value));
      } else {
        client.set(moduleName + key, value);
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  static async get(moduleName, key) {
    try {
      return await client.get(moduleName + key);
    } catch (error) {
      return false;
    }
  }

  static async hmset(tableName, uniqueValue, object, expireTime) {
    try {
      const key = `${redis.moduleName}:${tableName}`;
      await client.hmset(key, uniqueValue, JSON.stringify(object));
      if (expireTime) await client.expire(key, +expireTime);

      return true;
    } catch (err) {
      return false;
    }
  }

  static async hget(tableName, uniqueValue) {
    try {
      const result = await client.hget(`${redis.moduleName}:${tableName}`, uniqueValue);
      return JSON.parse(result);
    } catch (err) {
      return false;
    }
  }

  static async del(key) {
    try {
      const result = await client.del(key);
      return result;
    } catch (error) {
      return false;
    }
  }
}
module.exports = RedisCache;
