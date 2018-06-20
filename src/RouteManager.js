'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const busboy = require('connect-busboy');
const logger = require('consola');
const nconf = require('nconf');
const _ = require('lodash');

const StoreRoute = require('./routes/StoreRoute');
const ObjectRoute = require('./routes/ObjectRoute');
const StoreManager = require('./StoreManager');

class RouteManager {
    constructor({ port }) {
        const app = express();

        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded({ extended: false }));
        app.use(busboy());

        this.app = app;
        this.port = port;

        const storeManagerConfig = _.get(nconf.get('storeManager'), 'config', {});

        const storeManager = new StoreManager(storeManagerConfig);
        const storeRoute = new StoreRoute({ app, storeManager });
        const objectRoute = new ObjectRoute({ app, storeManager });

        this.storeMaanger = storeManager;
        this.storeRoute = storeRoute;
        this.objectRoute = objectRoute;

        this.storeRoute.initRoute();
        this.objectRoute.initRoute();
    }

    start() {
        this.app.listen(this.port, '0.0.0.0', 10000);
        logger.start(`Object Store listening on port ${this.port}...`);
    }
}

module.exports = RouteManager;
