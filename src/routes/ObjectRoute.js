'use strict';

const HttpStatus = require('http-status-codes');

class ObjectRoute {
    constructor({ app, storeManager }) {
        this.app = app;
        this.storeManager = storeManager;
    }

    initRoute() {
        this.app.post(
            '/object/:storeId/create',
            this.createObject.bind(this)
        );
        this.app.get(
            '/object/:storeId/:objectId',
            this.getObject.bind(this)
        );
        // this.app.delete(
        //     '/object/:storeId/:objectId',
        //     this.deleteObject.bind(this)
        // );
    }

    async createObject(request, response) {
        // TODO: Check that we are able to create an object.
        const storeId = request.params.storeId;
        // TODO: Validate request.

        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response.status(HttpStatus.NOT_FOUND)
                .status(`Store ${storeId} does not exist`);
        }

        const osObject = await store.createObject(storeId);
        if (!osObject) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .status('Failed to create object');
        }

        return response.send({
            objectId: osObject.objectId
        });
    }

    getObject(request, response) {
        // TODO: Check that we are able to get an object.
        const storeId = request.params.storeId;
        const objectId = request.params.objectId;
        // TODO: Validate request.

        const store = this.storeManager.getStore(storeId);
        if (!store) {
            return response.status(HttpStatus.NOT_FOUND)
                .status(`Store ${storeId} does not exist`);
        }

        const osObject = store.getObject(objectId);
        if (!osObject) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .status('Failed to create object');
        }

        return response.send({
            // TODO: Stream the object to them.
        });
    }

    // deleteObject() {

    // }
}

module.exports = ObjectRoute;
