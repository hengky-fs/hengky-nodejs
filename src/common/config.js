require('dotenv').config();

const envVars = process.env;

// if test, use test database
const isTestEnvironment = envVars.NODE_ENV === 'test';
const config = {
  env: envVars.NODE_ENV,
  isDirectoryApplicationLogsEnabled:
    envVars.IS_DIR_APPLICATION_LOGS_ENABLED || false,
  port: envVars.PORT,
  apiVersion: envVars.API_VERSION,
  mysql: {
    db: isTestEnvironment ? envVars.MYSQL_TEST_DB : envVars.MYSQL_DB,
    port: envVars.MYSQL_PORT,
    host: envVars.MYSQL_HOST,
    user: envVars.MYSQL_USER,
    password: envVars.MYSQL_PASSWORD,
  },
  sendGrid: {
    enable: envVars.SENDGRID_ENABLED || false,
    mailKey: envVars.SENDGRID_MAIL_KEY,
  },
  AWS_SES: {
    enable: envVars.AWS_SES_ENABLED,
    accessKey: envVars.AWS_ACCESS_KEY_SES,
    secretKey: envVars.AWS_SECRET_ACCESS_KEY_SES,
    region: envVars.AWS_SES_REGION,
    apiVersion: envVars.AWS_SES_API_VERSION,
  },
  emails: {
    formSubmissionFromEmail: envVars.EMAILS_FORM_SUBMISSION_FROM,
  },
  s3: {
    endpoint: envVars.S3_ENDPOINT,
    enable: envVars.S3_ENABLED || false,
    bucketName: envVars.S3_BUCKET_NAME,
  },
  binanceApi: {
    key: envVars.BINANCE_API_KEY,
    secret: envVars.BINANCE_API_SECRET,
    url: envVars.BINANCE_API_URL,
  },
  redis: {
    moduleName: envVars.REDIS_MODULE_NAME,
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD || '',
  },
  fixer: {
    apiUrl: envVars.FIXER_API_URL,
    accessKey: envVars.FIXER_ACCESS_KEY,
    cacheTtl: envVars.FIXER_CACHE_TTL || 300,
  },
  maxApiLimit: envVars.MAX_API_ATTEMPTS,
  apiLimitAttemptsTime: envVars.API_LIMIT_PERIOD_SECONDS,
  faeApiUrl: envVars.FAE_API_URL,
  tradingEngineUrl: envVars.TRADING_ENGINE_URL,
  detailOrderUrl: envVars.DETAIL_ORDER_URL,
  emailTemplateTtl: envVars.EMAIL_TEMPLATE_TTL,
  notifTemplateTtl: envVars.NOTIF_TEMPLATE_TTL,
  zendesk: {
    url: envVars.ZENDESK_URL,
    apiUrl: envVars.ZENDESK_API_URL,
    basicToken: envVars.ZENDESK_BASIC_TOKEN,
  },
  activateCronJob: envVars.ACTIVATE_CRON_JOB || false,
  cronSchedule: {
    autoExpiredOrder: envVars.AUTO_EXPIRED_ORDER_SCHEDULE,
    autoDisputedOrder: envVars.AUTO_DISPUTED_ORDER_SCHEDULE,
    autoUpdateCryptoTickerPrice: envVars.AUTO_UPDATE_CRYPTO_TICKER_PRICE,
    autoUpdateFiatPairing: envVars.AUTO_UPDATE_FIAT_PAIRING,
  },
  p2pChat: {
    url: envVars.P2P_CHAT_URL,
    signingKey: envVars.P2P_CHAT_SIGNING_KEY,
  },
  supportedCurrencies: envVars.SUPPORTED_CURRENCIES,
  cloudWatchLogs : {
    logGroupName : envVars.CLOUDWATCH_LOG_GROUP,
    logAwsRegion: envVars.CLOUDWATCH_LOG_REGION || 'ap-southeast-3',
  }
};

module.exports = config;
