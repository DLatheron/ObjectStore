'use strict';

const HttpStatus = require('http-status-codes');

class StoreRoute {
    constructor({ app, storeManager }) {
        this.app = app;
        this.storeManager = storeManager;
    }

    initRoute() {
        this.app.get(
            '/stores',
            this.getStores.bind(this)
        );

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

    async getStores(_, response) {
        const stores = await this.storeManager.listStores();
        const results = {
            stores: stores.map(store => ({
                id: store,
                name: 'Unknown',
                icon: null
            }))
        };

        response
            .status(HttpStatus.OK)
            .json(results);
    }

    async createStore(_, response) {
        // TODO: Check that we are able to create a store - by validating a pass token.

        const store = await this.storeManager.createStore();
        if (store) {
            const results = {
                storeId: store.storeId
            };

            response
                .status(HttpStatus.CREATED)
                .send(results);
        } else {
            response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .sendStatus('Failed to create store');
        }
    }

    async getStore(request, response) {
        // TODO: Check that we are authorised.
        const storeId = request.params.storeId;
        // TODO: Validate request.
        const store = await this.storeManager.getStore(storeId);
        if (store) {
            const results = {
                // TODO: Fill in some results.
            };

            response.send(results);
        } else {
            response
                .status(HttpStatus.NOT_FOUND)
                .send('Unrecognised store id');
        }
    }

    deleteStore() {

    }
}

module.exports = StoreRoute;
