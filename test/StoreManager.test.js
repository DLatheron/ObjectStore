/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const OSObjectHelper = require('../src/helpers/OSObjectHelper');
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
        it('should set default options');
        it('should allow options to be overridden');
    });

    describe('#createStore', () => {
        beforeEach(() => {
            sandbox.stub(OSObjectHelper, 'GenerateId').returns('storeId');
        });

        it('should attempt to create a store', async () => {
            sandbox.mock(AsyncOps)
                .expects('CreateDirectory')
                .withExactArgs('./Stores/store/Id/storeId/')
                .once()
                .returns(true);

            await storeManager.createStore('storeId');

            sandbox.verify();
        });

        it('should return a Store class if store creation succeeds', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);

            assert(await storeManager.createStore('storeId') instanceof Store, 'Not a Store');
        });

        it('should return undefined if store creation fails', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(false);

            assert.strictEqual(await storeManager.createStore('storeId'), undefined);
        });
    });

    describe('#getStore', () => {
        beforeEach(() => {
            storeManager = new StoreManager({ storeHierarchy: [5, 2]});
        });

        it('should return a store if it exists', async () => {
            sandbox.stub(AsyncOps, 'DirectoryExists').returns(true);

            const store = await storeManager.getStore('storeId');

            assert(store instanceof Store, 'Incorrect type returned');
            assert.strictEqual(store.storeId, 'storeId');
        });

        it('should return undefined if the store does not exist', async () => {
            sandbox.stub(AsyncOps, 'DirectoryExists').returns(false);

            assert.strictEqual(await storeManager.getStore('storeId'), undefined);
        });
    });

    describe('#deleteStore', () => {
        it('should attempt to delete the specified store (and sub-directories)');
        it('should return true if the operation is successful');
        it('should throw an error if the operation fails');
        it('should not attempt to delete a store that does not exist');
    });
});
