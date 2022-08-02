jest.mock('redis', () => jest.requireActual('redis-mock'));

// Fix for Jest, see https://stackoverflow.com/q/46227783
require('mysql2/node_modules/iconv-lite').encodingExists('foo');
