#!/usr/bin/env node

'use strict';

require('dotenv').config();
const { env } = process;

const { resetDb } = require('./common');

resetDb()
  .then(() => console.log(`✅ Successfully reset database ${env.MYSQL_DB}`))
  .catch(err => console.error(`❌ Failed resetting database due to:`, err));
