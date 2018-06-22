/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const sinon = require('sinon');

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

    });

    describe('#createStore', () => {
        beforeEach(() => {
            sandbox.stub(OSObjectHelper, 'GenerateId').returns('storeId');
        });

        it('should attempt to create a store', async () => {
            sandbox.mock(OSObjectHelper)
                .expects('CreateDirectory')
                .withExactArgs('./Stores/store/Id/storeId/')
                .once()
                .returns(true);

            await storeManager.createStore('storeId');

            sandbox.verify();
        });

        it('should return a Store class if store creation succeeds', async () => {
            sandbox.stub(OSObjectHelper, 'CreateDirectory').returns(true);

            assert(await storeManager.createStore('storeId') instanceof Store, 'Not a Store');
        });

        it('should return undefined if store creation fails', async () => {
            sandbox.stub(OSObjectHelper, 'CreateDirectory').returns(false);

            assert.strictEqual(await storeManager.createStore('storeId'), undefined);
        });
    });

    describe('#getStore', () => {
        beforeEach(() => {
            storeManager = new StoreManager({ storeHierarchy: [5, 2]});
        });

        it('should return a store if it exists', async () => {
            sandbox.stub(OSObjectHelper, 'DirectoryExists').returns(true);

            const store = await storeManager.getStore('storeId');

            assert(store instanceof Store, 'Incorrect type returned');
            assert.strictEqual(store.storeId, 'storeId');
        });

        it('should return undefined if the store does not exist', async () => {
            sandbox.stub(OSObjectHelper, 'DirectoryExists').returns(false);

            assert.strictEqual(await storeManager.getStore('storeId'), undefined);
        });
    });
});
