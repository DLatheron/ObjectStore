/* globals before, after */
'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const nconf = require('nconf');

const RouteManager = require('../../src/RouteManager');

let routeManager;

function initialise() {
    nconf.argv().env()
        .file('config', './config-integration-test.json')
        .defaults({
            port: 4002
        });

    const port = nconf.get('port');

    const app = express();

    app.disable('x-powered-by');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.enable('trust proxy');

    routeManager = new RouteManager({ app, port });

    routeManager.start();
}

before(() => {
    initialise();
});

after(() => {

});
