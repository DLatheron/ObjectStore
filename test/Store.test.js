/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

describe('#Store', () => {
    let sandbox;
    let fakeOSObject;
    let wrapper;
    let Store;
    let store;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        fakeOSObject = {
            _readDetails: () => true,
            _writeDetails: () => true
        };
        wrapper = {
            fakeOSObject: () => fakeOSObject
        };

        Store = proxyquire('../src/Store', {
            './OSObject': function() {
                return wrapper.fakeOSObject(...arguments);
            }
        });
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

        it('should attempt to create a directory for the object', async () => {
            sandbox.mock(store)
                .expects('createDirectory')
                .withExactArgs('./Stores/store/Id/storeId/object/Id/objectId/')
                .once()
                .returns(true);

            await store.createObject();

            sandbox.verify();
        });

        it('should return an OSObject if object creation succeeds', async () => {
            sandbox.stub(store, 'createDirectory').returns(true);

            const osObject = await store.createObject();

            assert.strictEqual(osObject, fakeOSObject);
        });

        it('should return undefined if the object does not exist', async () => {
            sandbox.stub(store, 'createDirectory').returns(false);

            assert.strictEqual(await store.createObject(), undefined);
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

            assert.strictEqual(osObject, fakeOSObject);
        });

        it('should return undefined if the object does not exist', async () => {
            sandbox.stub(store, 'directoryExists').returns(false);

            assert.strictEqual(await store.getObject('objectId'), undefined);
        });
    });

    describe('#updateObject', () => {

    });
});
