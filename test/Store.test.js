/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const sinon = require('sinon');

const OSObject = require('../src/OSObject');

describe('#Store', () => {
    let sandbox;
    let Store;
    let store;


    beforeEach(() => {
        sandbox = sinon.createSandbox();
        Store = require('../src/Store');
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {

    });

    describe('#buildObjectPath', () => {
    });

    describe('#createObject', () => {
        beforeEach(() => {
            store = new Store(
                'storeId',
                './Stores/store/Id/storeId/',
                { storeHierarchy: [5, 2], objectHierarchy: [6, 2] }
            );

            sandbox.stub(store, 'generateId').returns('objectId');
        });

        it('should attempt to create a directory for the object', () => {
            sandbox.mock(store)
                .expects('createDirectory')
                .withExactArgs('./Stores/store/Id/storeId/object/Id/objectId/')
                .once()
                .returns(true);

            store.createObject();

            sandbox.verify();
        });

        it('should return a Object class if object creation succeeds', () => {
            sandbox.stub(store, 'createDirectory').returns(true);

            const object = store.createObject();

            assert(object instanceof OSObject, 'Incorrect type returned');
            assert.strictEqual(object.objectId, 'objectId');
        });

        it('should return undefined if the object does not exist', () => {
            sandbox.stub(store, 'createDirectory').returns(false);

            assert.strictEqual(store.createObject(), undefined);
        });
    });

    describe('#getObject', () => {
        beforeEach(() => {
            store = new Store(
                'storeId',
                './Stores/store/Id/storeId/',
                { storeHierarchy: [5, 2], objectHierarchy: [6, 2] }
            );

            sandbox.stub(store, 'generateId').returns('objectId');
        });

        it('should return an object if it exists', async () => {
            sandbox.stub(store, 'directoryExists').returns(true);

            const osObject = await store.getObject('objectId');

            assert(osObject instanceof OSObject, 'Incorrect type returned');
            assert.strictEqual(osObject.objectId, 'objectId');
        });

        it('should return undefined if the object does not exist', async () => {
            sandbox.stub(store, 'directoryExists').returns(false);

            assert.strictEqual(await store.getObject('objectId'), undefined);
        });
    });
});
