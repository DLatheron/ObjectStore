/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const sinon = require('sinon');

const Store = require('../src/Store');

describe('#StoreManager', () => {
    let sandbox;
    let StoreManager;
    let storeManager;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        StoreManager = require('../src/StoreManager');
        storeManager = new StoreManager({ storeHierarchy: [5, 2]});
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {

    });

    describe('#createStore', () => {
        beforeEach(() => {
            sandbox.stub(storeManager, 'generateId').returns('storeId');
        });

        it('should attempt to create a store', () => {
            sandbox.mock(storeManager)
                .expects('createDirectory')
                .withExactArgs('./Stores/store/Id/storeId/')
                .once()
                .returns(true);

            storeManager.createStore('storeId');

            sandbox.verify();
        });

        it('should return a Store class if store creation succeeds', () => {
            sandbox.stub(storeManager, 'createDirectory').returns(true);

            assert(storeManager.createStore('storeId') instanceof Store, 'Not a Store');
        });

        it('should return undefined if store creation fails', () => {
            sandbox.stub(storeManager, 'createDirectory').returns(false);

            assert.strictEqual(storeManager.createStore('storeId'), undefined);
        });
    });

    describe('#getStore', () => {
        beforeEach(() => {
            storeManager = new StoreManager({ storeHierarchy: [5, 2]});
        });

        it('should return a store if it exists', async () => {
            sandbox.stub(storeManager, 'directoryExists').returns(true);

            const store = await storeManager.getStore('storeId');

            assert(store instanceof Store, 'Incorrect type returned');
            assert.strictEqual(store.storeId, 'storeId');
        });

        it('should return undefined if the store does not exist', async () => {
            sandbox.stub(storeManager, 'directoryExists').returns(false);

            assert.strictEqual(await storeManager.getStore('storeId'), undefined);
        });
    });
});
