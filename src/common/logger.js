const { createLogger, format, transports } = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const WinstonCloudWatch = require('winston-cloudwatch');
const config = require('./config');

const colorizer = format.colorize();

const allTransports = [
  new transports.Console({
    level: 'info',
    format: format.combine(
      format.simple(),
      format.printf((msg) => colorizer.colorize(
        msg.level,
        `${msg.timestamp} - [${msg.level}] - ${msg.message}${
          msg.meta ? `- ${JSON.stringify(msg.meta)}` : ''}`,
      )),
    ),
    handleExceptions: true,
  }),
];

if (config.isDirectoryApplicationLogsEnabled) {
  const options = {
    dirname: 'logs/api-logs',
    filename: 'application-%DATE%-combined.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    handleExceptions: true,
  };

  allTransports.push(
    new DailyRotateFile({
      ...options,
      level: 'error',
      filename: 'application-%DATE%-error.log',
    }),
  );

  allTransports.push(new DailyRotateFile(options));
}

const {
  logGroupName,
  logAwsRegion,
} = config.cloudWatchLogs;
if (config.env !== 'test' && logGroupName && logAwsRegion) {
  allTransports.push(new WinstonCloudWatch({
    logGroupName,
    logStreamName() {
      const date = new Date().toISOString().split('T')[0];
      return `express-server-${date}`;
    },
    awsRegion: logAwsRegion,
    jsonMessage: true,
  }));
}

const logger = createLogger({
  format: format.combine(format.timestamp(), format.json()),
  transports: allTransports,
  exitOnError: false,
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write(message) {
    if (message) {
      logger.info(message.slice(0, -1));
    }
  },
};

module.exports = logger;
