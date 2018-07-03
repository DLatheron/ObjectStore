/* globals describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const OSObject = require('../src/OSObject');
const OSObjectHelper = require('../src/helpers/OSObjectHelper');
const { Reasons } = require('../src/OSError');

describe('#Store', () => {
    let sandbox;
    let Store;
    let store;
    let stubOSObject;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        stubOSObject = new OSObject();

        Store = proxyquire('../src/Store', {
            './helpers/AsyncOps': AsyncOps,
            './helpers/OSObjectHelper': OSObjectHelper,
            './OSObject': function() {
                stubOSObject.storeId = arguments[0];
                stubOSObject.objectId = arguments[1];
                stubOSObject.basePath = arguments[2];

                return stubOSObject;
            }
        });
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should record the store id', () => {
            store = new Store('storeId');
            assert.strictEqual(store.storeId, 'storeId');
        });

        it('should store the base path', () => {
            store = new Store(undefined, './basePath/');
            assert.strictEqual(store.basePath, './basePath/');
        });

        context('options', () => {
            [
                { optionName: 'objectHierarchy', defaultValue: [3, 3], overriddenValue: [2, 4, 5] },
                { optionName: 'pathSeparator', defaultValue: '/', overriddenValue: '\\' }
            ]
                .forEach(({ optionName, defaultValue, overriddenValue}) => {
                    it(`should default '${optionName}' = ${defaultValue} as type ${typeof defaultValue}`, () =>{
                        store = new Store();

                        assert.deepStrictEqual(store.options[optionName], defaultValue);
                    });

                    it('should merge the options', () => {
                        it(`should all '${optionName}' to be overridden to ${overriddenValue}`, () => {
                            store = new Store(undefined, undefined, {
                                [optionName]: overriddenValue
                            });

                            assert.deepStrictEqual(store.options[optionName], overriddenValue);
                        });
                    });
                });
        });
    });

    describe('#buildObjectPath', () => {
        [
            { objectId: 'objectId', objectHierarchy: [3, 3], expectedPath: 'obj/ect/objectId/' },
            { objectId: 'objectId', objectHierarchy: [6, 2], expectedPath: 'object/Id/objectId/' }
        ]
            .forEach(({ objectId, objectHierarchy, expectedPath}) => {
                it(`should generate the path ${expectedPath} for object id ${objectId} and the hierarchy ${objectHierarchy}`, () => {
                    store = new Store(undefined, undefined, { objectHierarchy });
                    assert.strictEqual(
                        store.buildObjectPath(objectId),
                        expectedPath
                    );
                });
            });
    });

    describe('#createObject', () => {
        beforeEach(() => {
            store = new Store(
                'storeId',
                './Stores/store/Id/storeId/',
                { storeHierarchy: [5, 2], objectHierarchy: [6, 2] }
            );

            sandbox.stub(OSObjectHelper, 'GenerateId').returns('objectId');
        });

        it('should attempt to create a directory for the object', async () => {
            sandbox.mock(AsyncOps)
                .expects('CreateDirectory')
                .withExactArgs('./Stores/store/Id/storeId/object/Id/objectId/')
                .once()
                .returns(true);
            sandbox.stub(stubOSObject, 'createObject');

            await store.createObject();

            sandbox.verify();
        });

        it('should attempt to call create on the OSObject', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);
            sandbox.mock(stubOSObject)
                .expects('createObject')
                .withExactArgs()
                .once();

            await store.createObject();

            sandbox.verify();
        });

        it('should return an OSObject if object creation succeeds', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(true);
            sandbox.stub(stubOSObject, 'createObject');

            const osObject = await store.createObject();

            assert.strictEqual(osObject, stubOSObject);
        });

        it('should throw an error if the object directory could not be created', async () => {
            sandbox.stub(AsyncOps, 'CreateDirectory').returns(false);

            try {
                assert.strictEqual(await store.createObject(), undefined);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error.reason, Reasons.DirectoryFailure);
            }
        });
    });

    describe('#getObject', () => {
        beforeEach(() => {
            store = new Store(
                'storeId',
                './Stores/store/Id/storeId/',
                { storeHierarchy: [5, 2], objectHierarchy: [6, 2] }
            );

            sandbox.stub(OSObjectHelper, 'GenerateId').returns('objectId');
        });

        it('should return an object if it exists', async () => {
            sandbox.stub(AsyncOps, 'DirectoryExists').returns(true);

            const osObject = await store.getObject('objectId');

            assert.strictEqual(osObject, stubOSObject);
        });

        it('should return undefined if the object does not exist', async () => {
            sandbox.stub(AsyncOps, 'DirectoryExists').returns(false);

            assert.strictEqual(await store.getObject('objectId'), undefined);
        });
    });
});
