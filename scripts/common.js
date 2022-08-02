'use strict';

require('dotenv').config();
const { env } = process;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { DB_DOCKER_CONTAINER } = require('./docker_config');

const dockerExec = (script) => `docker exec ${DB_DOCKER_CONTAINER} sh -c ${script}`;

exports.resetDb = () => {
  const script = './scripts/db_reset.sh';
  return exec(env.CI ? script : dockerExec(script));
}

exports.dumpDb = () => exec(dockerExec('./scripts/db_dump.sh'));

exports.createNetwork = networkName =>
  exec(`docker network create ${networkName}`).catch(err => {});
