#!/usr/bin/env node

'use strict';

require('dotenv').config();
const { env } = process;

const { dumpDb } = require('./common');

dumpDb()
  .then(() => console.log(`✅ Successfully dumped database ${env.MYSQL_DB}`))
  .catch(err => console.error(`❌ Failed dumping database due to:`, err));