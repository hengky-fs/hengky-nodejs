#!/usr/bin/env node

'use strict';

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { DB_DOCKER_CONTAINER } = require('./docker_config');

exec(`docker stop ${DB_DOCKER_CONTAINER}`)
  .then(() => console.log(`✅ Successfully stopped DB container`))
  .catch(err => console.error(`❌ Failed stopping DB container due to:`, err));
