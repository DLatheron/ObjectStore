/* globals describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const { Reasons, OSError } = require('../src/OSError');
const OSObject = require('../src/OSObject');
const OSObjectHelper = require('../src/helpers/OSObjectHelper');
const Store = require('../src/Store');

describe('#StoreManager', () => {
    let sandbox;
    let wrapper;
    let StoreManager;
    let storeManager;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        wrapper = {
            newStore: function() { return new Store(...arguments); }
        };

        StoreManager = proxyquire('../src/StoreManager', {
            './Store': function() { return wrapper.newStore(...arguments); }
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {
        context('options', () => {
            [
                { optionName: 'storeHierarchy', defaultValue: [3, 3], overriddenValue: [3, 3, 5] },
                { optionName: 'objectHierarchy', defaultValue: [3, 3], overriddenValue: [2, 4, 5] },
                { optionName: 'pathSeparator', defaultValue: '/', overriddenValue: '\\' },
                { optionName: 'basePath', defaultValue: './Stores/', overriddenValue: './SubDir/MyStores/' }
            ]
                .forEach(({ optionName, defaultValue, overriddenValue}) => {
                    it(`should default '${optionName}' = ${defaultValue} as type ${typeof defaultValue}`, () =>{
                        storeManager = new StoreManager();

                        assert.deepStrictEqual(storeManager.options[optionName], defaultValue);
                    });

                    it('should merge the options', () => {
                        it(`should all '${optionName}' to be overridden to ${overriddenValue}`, () => {
                            storeManager = new StoreManager({
                                [optionName]: overriddenValue
                            });

                            assert.deepStrictEqual(storeManager.options[optionName], overriddenValue);
                        });
                    });
                });
        });
    });


    describe('#buildStorePath', () => {
        [
            { storeId: 'storeId', storeHierarchy: [3, 3], pathSeparator: '/', expectedPath: 'sto/reI/storeId/' },
            { storeId: 'storeId', storeHierarchy: [5, 2], pathSeparator: '/', expectedPath: 'store/Id/storeId/' },
            { storeId: 'storeId', storeHierarchy: [5, 2], pathSeparator: '\\', expectedPath: 'store\\Id\\storeId\\' }
        ]
            .forEach(({ storeId, storeHierarchy, pathSeparator, expectedPath}) => {
                it(`should generate the path ${expectedPath} for store id ${storeId} and the hierarchy ${storeHierarchy}`, () => {
                    storeManager = new StoreManager({ storeHierarchy, pathSeparator });
                    assert.strictEqual(
                        storeManager.buildStorePath(storeId),
                        expectedPath
                    );
                });
            });
    });

    describe('#createStore', () => {
        let fakeStore;
        let fakeStoreObject;

        beforeEach(() => {
            sandbox.stub(OSObjectHelper, 'GenerateId').returns('storeId');
            storeManager = new StoreManager({ storeHierarchy: [5, 2]});
            fakeStore = new Store('storeId', 'basePath', { options: true });
            fakeStoreObject = new OSObject('storeId', 'storeId', 'fullPath');
        });

        it('should attempt to create a store directory', async () => {
            sandbox.mock(AsyncOps)
                .expects('CreateDirectory')
                .withExactArgs('./Stores/store/Id/storeId/')
                .once()
                .returns(true);
            sandbox.stub(wrapper, 'newStore').returns(fakeStore);
            sandbox.stub(fakeStore, 'createStoreObject').returns(fakeStoreObject);
            sandbox.stub(fakeStoreObject, 'updateObject').returns(fakeStoreObject);

            await storeManager.createStore();

            sandbox.verify();
        });

        it('should create a new store', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);
            sandbox.mock(wrapper)
                .expects('newStore')
                .withExactArgs(
                    'storeId',
                    './Stores/store/Id/storeId/',
                    storeManager.options
                )
                .once()
                .returns(fakeStore);
            sandbox.stub(fakeStore, 'createStoreObject').returns(fakeStoreObject);
            sandbox.stub(fakeStoreObject, 'updateObject');

            await storeManager.createStore();

            sandbox.verify();
        });

        it('should create a store object', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);
            sandbox.stub(wrapper, 'newStore').returns(fakeStore);
            sandbox.mock(fakeStore)
                .expects('createStoreObject')
                .withExactArgs()
                .once()
                .returns(fakeStoreObject);
            sandbox.stub(fakeStoreObject, 'updateObject');

            await storeManager.createStore();

            sandbox.verify();
        });

        it('should update the created store object with the passed metadata', async () => {
            const metadata = {
                content: 'This is some store metadata',
                specialVersion: 25
            };
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);
            sandbox.stub(wrapper, 'newStore').returns(fakeStore);
            sandbox.stub(fakeStore, 'createStoreObject').returns(fakeStoreObject);
            sandbox.mock(fakeStoreObject)
                .expects('updateObject')
                .withExactArgs(
                    null,
                    metadata
                )
                .once();

            await storeManager.createStore(metadata);

            sandbox.verify();
        });

        it('should return the store object if store creation succeeds', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);
            sandbox.stub(wrapper, 'newStore').returns(fakeStore);
            sandbox.stub(fakeStore, 'createStoreObject').returns(fakeStoreObject);
            sandbox.stub(fakeStoreObject, 'updateObject').returns(fakeStoreObject);

            assert(await storeManager.createStore() instanceof OSObject, 'Not a Store Object');
        });

        it('should throw an OSError if store creation fails', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(false);

            try {
                await storeManager.createStore('storeId');
            } catch (error) {
                assert.deepStrictEqual(error, new OSError(Reasons.DirectoryFailure));
            }
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
        beforeEach(() => {
            storeManager = new StoreManager({
                basePath: './basePath/',
                storeHierarchy: [5, 2]
            });
        });

        it('should attempt to delete the specified store (and sub-directories)', async () => {
            sandbox.mock(AsyncOps)
                .expects('DeleteFile')
                .withExactArgs('./basePath/store/Id/storeId/')
                .once();

            await storeManager.deleteStore('storeId');

            sandbox.verify();
        });

        it('should return true if the operation is successful', async () => {
            sandbox.stub(AsyncOps, 'DeleteFile');

            assert.strictEqual(await storeManager.deleteStore('storeId'), true);
        });

        it('should return false if the operation fails', async () => {
            const expectedError = new Error('DeleteFile threw this error');

            sandbox.stub(AsyncOps, 'DeleteFile').throws(expectedError);

            assert.strictEqual(await storeManager.deleteStore('storeId'), false);
        });
    });
});
