/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const OSObjectHelper = require('../src/helpers/OSObjectHelper');
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
            './helpers/OSObjectHelper': OSObjectHelper,
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

            sandbox.stub(OSObjectHelper, 'GenerateId').returns('objectId');
        });

        it('should attempt to create a directory for the object', async () => {
            sandbox.mock(OSObjectHelper)
                .expects('CreateDirectory')
                .withExactArgs('./Stores/store/Id/storeId/object/Id/objectId/')
                .once()
                .returns(true);

            await store.createObject();

            sandbox.verify();
        });

        it('should return an OSObject if object creation succeeds', async () => {
            sandbox.stub(OSObjectHelper, 'CreateDirectory').returns(true);

            const osObject = await store.createObject();

            assert.strictEqual(osObject, fakeOSObject);
        });

        it('should return undefined if the object does not exist', async () => {
            sandbox.stub(OSObjectHelper, 'CreateDirectory').returns(false);

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

            sandbox.stub(OSObjectHelper, 'GenerateId').returns('objectId');
        });

        it('should return an object if it exists', async () => {
            sandbox.stub(OSObjectHelper, 'DirectoryExists').returns(true);

            const osObject = await store.getObject('objectId');

            assert.strictEqual(osObject, fakeOSObject);
        });

        it('should return undefined if the object does not exist', async () => {
            sandbox.stub(OSObjectHelper, 'DirectoryExists').returns(false);

            assert.strictEqual(await store.getObject('objectId'), undefined);
        });
    });

    describe('#updateObject', () => {

    });
});
