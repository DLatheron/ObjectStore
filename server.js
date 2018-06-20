'use strict';

const argv = require('yargs').argv;
const nconf = require('nconf');

nconf.argv().env()
    .file('config', { file: argv.config || './config.json' })
    .defaults({
        port: 4000
    });

const port = argv.port || nconf.get('port');

const RouteManager = require('./src/RouteManager');
const routeManager = new RouteManager({ port });

routeManager.start();
