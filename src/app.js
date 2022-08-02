const http = require('http');
const morgan = require('morgan');
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const { config, logger } = require('./common');
const { setRouter } = require('./routes/api');
const { replaceErrors } = require('./common/utils');

// Global Error Handler
const { globalErrorHandler } = require('./utils/response');
const crons = require('./common/cronjobs');

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection Details::${err}`);
});

process.on('uncaughtException', (err) => {
  logger.error(
    `Uncaught Exception Details::${JSON.stringify(err, replaceErrors)}`
  );
});

const app = express();
app.server = http.createServer(app);

// this method is used to invoke cronjobs for p2p services
crons();

app.use(
  morgan(
    ':method :url :remote-addr :status - :response-time ms [:date[clf]] HTTP/:http-version :user-agent :body',
    { stream: logger.stream }
  )
);
morgan.token('body', (req) => (req.body ? JSON.stringify(req.body) : ''));

// parse application/json
app.use(express.json({ limit: '2000kb' }));
app.use(express.urlencoded({ extended: false }));
app.use(compression());

app.disable('x-powered-by');

// cors
app.use(cors());

setRouter(app);

// server health-Check
app.get('/', (req, res) => {
  res.sendFile(`${__dirname}/templates/error-pages/HTTP401.html`);
});

// Added Global Error handler as middleware
app.use((err, req, res, next) => globalErrorHandler(err, req, res, next));

app.server.listen(config.port, () => {
  logger.info(
    `Started server on => http://localhost:${app.server.address().port}`
  );
});

module.exports = { app };
