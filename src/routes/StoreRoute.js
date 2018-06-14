'use strict';

class StoreRoute {
    constructor({ app, storeManager }) {
        this.app = app;
        this.storeManager = storeManager;
    }

    initRoute() {
        this.app.post(
            '/store/create',
            this.createStore.bind(this)
        );
        this.app.get(
            '/store/:storeId',
            this.getStore.bind(this)
        );
        this.app.delete(
            '/store/:storeId',
            this.deleteStore.bind(this)
        );
    }

    createStore(_, response) {
        // TODO: Check that we are able to create a store - by validating a pass token.

        const store = this.storeManager.createStore();
        if (store) {
            const results = {
                storeId: store.storeId
            };

            response.send(results);
        } else {
            response.sendStatus('Failed to create store');
        }
    }

    getStore(request, response) {
        // TODO: Check that we are authorised.
        const storeId = request.params.storeId;
        // TODO: Validate request.
        const store = this.storeManager.getStore(storeId);
        if (store) {
            const results = {
                // TODO: Fill in some results.
            };

            response.send(results);
        } else {
            response.status(404).send('Unrecognised store id');
        }
    }

    deleteStore() {

    }
}

module.exports = StoreRoute;
