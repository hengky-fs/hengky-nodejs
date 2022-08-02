const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// default current time with UAE timezone
function getCustomTimestamp(date = Date.now(), tz = 'Asia/Dubai', format = 'MMM DD YYYY HH:mm:ss') {
  return  dayjs(date).tz(tz).format(format);
}

module.exports = { getCustomTimestamp };