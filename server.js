'use strict';

const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const express = require('express');
const logger = require('consola');
const nconf = require('nconf');

const app = express();

nconf.argv().env()
    .file('config', { file: argv.config || './config.json' })
    .defaults({
        port: 4000
    });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const port = argv.port || nconf.get('port');

app.listen(port, '0.0.0.0', 10000);
logger.start(`object store listening on port ${port}...`);
