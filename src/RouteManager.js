'use strict';

const logger = require('consola');

const StoreRoute = require('./routes/StoreRoute');
const ObjectRoute = require('./routes/ObjectRoute');
const StoreManager = require('./StoreManager');

class RouteManager {
    constructor({ app, port }) {
        this.app = app;
        this.port = port;

        const storeManager = new StoreManager();
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
