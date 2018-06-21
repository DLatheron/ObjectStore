/* globals before, after */
'use strict';

const { promisify } = require('util');

const bodyParser = require('body-parser');
const consola = require('consola');
const express = require('express');
const fs = require('fs-extra');
const nconf = require('nconf');
const _ = require('lodash');

const RouteManager = require('../../src/RouteManager');

const removeDir = promisify(fs.remove);

let routeManager;

function initialise() {
    nconf.argv().env()
        .file('config', './config-integration-test.json')
        .defaults({
            port: 4002,
            storeManager: {
                config: {
                    storeHierarchy: [3, 3],
                    objectHierarchy: [3, 3],
                    pathSeparator: '/',
                    basePath: './IntegrationTestStores/',
                }
            }
        });

    consola.clear();

    const port = nconf.get('port');
    consola.log(`Port is ${port}`);

    const app = express();

    app.disable('x-powered-by');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.enable('trust proxy');

    routeManager = new RouteManager({ app, port });

    routeManager.start();
}

async function cleanUpAllStores() {
    const basePath = _.get(nconf.get('storeManager'), 'config.basePath');

    await removeDir(basePath);
}

before(() => {
    initialise();
});

after(async () => {
    await cleanUpAllStores();
});
