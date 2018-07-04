/* globals describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
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
        beforeEach(() => {
            sandbox.stub(OSObjectHelper, 'GenerateId').returns('storeId');
            storeManager = new StoreManager({ storeHierarchy: [5, 2]});
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
