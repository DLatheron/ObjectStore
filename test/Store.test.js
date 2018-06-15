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
            readDetails: () => true,
            writeDetails: () => true
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

        it('should attempt to create a directory for the object', () => {
            sandbox.mock(store)
                .expects('createDirectory')
                .withExactArgs('./Stores/store/Id/storeId/object/Id/objectId/')
                .once()
                .returns(true);

            store.createObject();

            sandbox.verify();
        });

        it('should return an OSObject if object creation succeeds', () => {
            sandbox.stub(store, 'createDirectory').returns(true);

            const osObject = store.createObject();

            assert.strictEqual(osObject, fakeOSObject);
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

        it('should return an object if it exists', () => {
            sandbox.stub(store, 'directoryExists').returns(true);

            const osObject = store.getObject('objectId');

            assert.strictEqual(osObject, fakeOSObject);
        });

        it('should return undefined if the object does not exist', () => {
            sandbox.stub(store, 'directoryExists').returns(false);

            assert.strictEqual(store.getObject('objectId'), undefined);
        });
    });

    describe('#updateObject', () => {

    });
});
