'use strict';

const argv = require('yargs').argv;
const bodyParser = require('body-parser');
const busboy = require('connect-busboy');
const express = require('express');
const nconf = require('nconf');

const app = express();

nconf.argv().env()
    .file('config', { file: argv.config || './config.json' })
    .defaults({
        port: 4000
    });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(busboy());

const port = argv.port || nconf.get('port');

const RouteManager = require('./src/RouteManager');
const routeManager = new RouteManager({ app, port });

routeManager.start();
