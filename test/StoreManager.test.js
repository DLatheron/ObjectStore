/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid/v4');

const Object = require('../src/Object');
const Store = require('../src/Store');
const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#StoreManager', () => {
    let sandbox;
    let uuidWrapper;
    let StoreManager;
    let storeManager;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        uuidWrapper = {
            uuid
        };

        StoreManager = proxyquire('../src/StoreManager', {
            'uuid/v4': function() { return uuidWrapper.uuid(); }
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {

    });

    describe('#generateId', () => {
        beforeEach(() => {
            storeManager = new StoreManager();
        });

        it('should generate a v4 uuid', () => {
            sandbox.mock(uuidWrapper)
                .expects('uuid')
                .withExactArgs()
                .once();

            storeManager.generateId();

            sandbox.verify();
        });

        it('should return the generated uuid', () => {
            const expectedId = '123e4567-e89b-12d3-a456-426655440000';
            sandbox.stub(uuidWrapper, 'uuid').returns(expectedId);

            assert.strictEqual(storeManager.generateId(), expectedId);
        });
    });

    describe('#uuidToPath', () => {
        [
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [3, 4], expectedPath: '123/e456/' },
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [3, 3], expectedPath: '123/e45/' },
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [6, 6], expectedPath: '123e45/67e89b/' },
            { uuid: '123e4567e89b12d3a456426655440000', hierarchy: [6, 6], expectedPath: '123e45/67e89b/' },
            { uuid: '123e4567e89b12d3a456426655440000', hierarchy: [6, 6], pathSeparator: '\\', expectedPath: '123e45\\67e89b\\' }
        ]
            .forEach(({ uuid, hierarchy, pathSeparator = '/', expectedPath }) => {
                it(`should split uuid ${uuid} with hierarchy ${hierarchy} into path ${expectedPath} with separator ${pathSeparator}`, () => {
                    storeManager = new StoreManager();

                    assert.strictEqual(storeManager.uuidToPath(uuid, hierarchy, pathSeparator), expectedPath);
                });
            });
    });

    describe('#buildPath', () => {
        [
            {
                storeId: 'storeId',
                objectId: 'objectId',
                options: {
                    storeHierarchy: [3, 3],
                    objectHierarchy: [3, 3]
                },
                expectedPath: 'sto/reI/storeId/obj/ect/objectId/'
            },
            {
                storeId: 'storeId',
                objectId: 'objectId',
                options: {
                    storeHierarchy: [5, 2],
                    objectHierarchy: [6, 2]
                },
                expectedPath: 'store/Id/storeId/object/Id/objectId/'
            },
            {
                storeId: 'storeId',
                objectId: 'objectId',
                options: {
                    storeHierarchy: [5, 2],
                    objectHierarchy: [6, 2],
                    pathSeparator: '\\'
                },
                expectedPath: 'store\\Id\\storeId\\object\\Id\\objectId\\'
            }
        ]
            .forEach(({ storeId, objectId, options, expectedPath }) => {
                it(`should build a path for ${storeId} -> ${objectId} into path ${expectedPath}`, () => {
                    storeManager = new StoreManager(options);

                    assert.strictEqual(storeManager.buildPath(storeId, objectId), expectedPath);
                });
            });
    });

    describe('#getOrCreateStore', () => {
        let mkdirPromise;

        beforeEach(() => {
            storeManager = new StoreManager({ storeHierarchy: [5, 2]});
            mkdirPromise = UnitTestHelper.createPromise();
        });

        it('should attempt to create a store', () => {
            sandbox.mock(storeManager)
                .expects('mkdir')
                .withExactArgs('./Stores/store/Id/storeId/')
                .once()
                .returns(mkdirPromise.fulfill());

            return storeManager.getOrCreateStore('storeId')
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return a Store class if store creation succeeds', async () => {
            sandbox.stub(storeManager, 'mkdir').returns(mkdirPromise.fulfill());

            assert(await storeManager.getOrCreateStore('storeId') instanceof Store, 'Not a Store');
        });

        it('should return undefined if store creation fails', async () => {
            sandbox.stub(storeManager, 'mkdir').returns(mkdirPromise.reject());

            assert.strictEqual(await storeManager.getOrCreateStore('storeId'), undefined);
        });
    });


    describe('#getOrCreateObject', () => {
        let mkdirPromise;

        beforeEach(() => {
            storeManager = new StoreManager({ storeHierarchy: [5, 2], objectHierarchy: [6, 2] });
            mkdirPromise = UnitTestHelper.createPromise();
        });

        it('should attempt to create a store', () => {
            sandbox.mock(storeManager)
                .expects('mkdir')
                .withExactArgs('./Stores/store/Id/storeId/object/Id/objectId/')
                .once()
                .returns(mkdirPromise.fulfill());

            return storeManager.getOrCreateObject('storeId', 'objectId')
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return an Object class if store creation succeeds', async () => {
            sandbox.stub(storeManager, 'mkdir').returns(mkdirPromise.fulfill());

            assert(await storeManager.getOrCreateObject('storeId', 'objectId') instanceof Object, 'Not an Object');
        });

        it('should return false if store creation fails', async () => {
            sandbox.stub(storeManager, 'mkdir').returns(mkdirPromise.reject());

            assert.strictEqual(await storeManager.getOrCreateObject('storeId', 'objectId'), undefined);
        });
    });
});
