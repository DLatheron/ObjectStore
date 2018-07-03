/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const fs = require('fs');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const VersionLock = require('../src/VersionLock');
// const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#Object', () => {
    let sandbox;
    let OSObject;
    let osObject;
    let wrapper;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        wrapper = {
            VersionLock: function() { return new VersionLock(...arguments); }
        };

        OSObject = proxyquire('../src/OSObject', {
            'fs': fs,
            './VersionLock': function() { return wrapper.VersionLock(...arguments); }
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should record the store id', () => {
            osObject = new OSObject('storeId');
            assert.strictEqual(osObject.storeId, 'storeId');
        });

        it('should record the object id', () => {
            osObject = new OSObject(undefined, 'objectId');
            assert.strictEqual(osObject.objectId, 'objectId');
        });

        it('should store the base path', () => {
            osObject = new OSObject(undefined, undefined, './basePath/');
            assert.strictEqual(osObject.basePath, './basePath/');

        });
    });

    describe('#_buildMetadataPath', () => {
        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');
        });

        [
            { version: 0, expectedPath: './basePath/metadata.v000000.json' },
            { version: 1, expectedPath: './basePath/metadata.v000001.json' },
            { version: 123, expectedPath: './basePath/metadata.v000123.json' },
            { version: 999999, expectedPath: './basePath/metadata.v999999.json' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(osObject._buildMetadataPath(version), expectedPath);
                });
            });
    });

    describe('#_updateMetadata', () => {
        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');
        });

        it('should generate a version specific filename', async () => {
            sandbox.mock(osObject)
                .expects('_buildMetadataPath')
                .withExactArgs(17)
                .once();
            sandbox.stub(AsyncOps, 'WriteWholeFile');

            await osObject._updateMetadata(17, {});

            sandbox.verify();
        });

        it('should attempt to write the metadata', async () => {
            const filename = 'a filename';
            const metadata = {
                'some metadata': true
            };
            sandbox.stub(osObject, '_buildMetadataPath').returns(filename);
            sandbox.mock(AsyncOps)
                .expects('WriteWholeFile')
                .withExactArgs(filename, JSON.stringify(metadata, null, 4))
                .once();

            await osObject._updateMetadata(undefined, metadata);

            sandbox.verify();
        });

        it('should not attempt to write anything if no metadata is supplied', async () => {
            sandbox.mock(osObject)
                .expects('_buildMetadataPath')
                .never();
            sandbox.mock(AsyncOps)
                .expects('WriteWholeFile')
                .never();

            await osObject._updateMetadata(undefined, undefined);

            sandbox.verify();

        });
    });

    describe('#_buildContentPath', () => {
        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');
        });

        [
            { version: 0, expectedPath: './basePath/content.v000000.bin' },
            { version: 1, expectedPath: './basePath/content.v000001.bin' },
            { version: 683, expectedPath: './basePath/content.v000683.bin' },
            { version: 999999, expectedPath: './basePath/content.v999999.bin' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(osObject._buildContentPath(version), expectedPath);
                });
            });
    });

    describe('#_updateContent', () => {
        let streamClosedEvent;
        let streamErrorEvent;

        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');

            streamClosedEvent = sinon.stub().onCall(0).yields();
            streamErrorEvent = sinon.stub().onCall(1);
        });

        it('should generate a version specific filename', async () => {
            const filename = 'specific filename';
            sandbox.mock(osObject)
                .expects('_buildContentPath')
                .withExactArgs(23)
                .once()
                .returns(filename);
            sandbox.mock(fs)
                .expects('createWriteStream')
                .withExactArgs(filename)
                .once()
                .returns({
                    on: streamClosedEvent
                });

            await osObject._updateContent(23, { pipe: () => {} });

            sandbox.verify();
        });

        it('should attempt to write the content', async () => {
            const fakeVersionStream = {
                on: (event, callback) => {
                    if (event === 'close') {
                        callback();
                    }
                }
            };

            sandbox.stub(osObject, '_buildContentPath');
            sandbox.stub(fs, 'createWriteStream').returns(fakeVersionStream);

            await osObject._updateContent(54, {
                pipe: sandbox.mock()
                    .withExactArgs(fakeVersionStream)
                    .once()
            });

            sandbox.verify();
        });

        it('should throw an error if the content stream errors', async () => {
            const expectedError = 'Something bad happened';
            const fakeVersionStream = {
                on: streamErrorEvent.yields(expectedError)
            };

            sandbox.stub(osObject, '_buildContentPath');
            sandbox.stub(fs, 'createWriteStream').returns(fakeVersionStream);

            try {
                await osObject._updateContent(54, {
                    pipe: () => {}
                });
                assert.fail();
            } catch (error) {
                assert.strictEqual(error, expectedError);
            }

            sandbox.verify();
        });

        it('should not attempt to write anything if no content is supplied', async () => {
            sandbox.mock(osObject)
                .expects('_buildContentPath')
                .never();
            sandbox.mock(fs)
                .expects('createWriteStream')
                .never();

            await osObject._updateContent(82);

            sandbox.verify();
        });
    });

    describe('#createObject', () => {
        const expectedFirstVersion = 1;

        let fakeVersionLock;

        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');

            fakeVersionLock = {
                create: () => {}
            };
        });

        it('should attempt to acquire a version lock', async () => {
            sandbox.mock(wrapper)
                .expects('VersionLock')
                .withExactArgs(osObject.basePath)
                .once()
                .returns(fakeVersionLock);

            await osObject.createObject();

            sandbox.verify();
        });

        it(`should create an object starting a version ${expectedFirstVersion}`, async () => {
            sandbox.mock(fakeVersionLock)
                .expects('create')
                .withExactArgs({ latestVersion: expectedFirstVersion })
                .once();
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);

            await osObject.createObject();

            sandbox.verify();
        });

        it('should throw an error if the lock cannot be created', async () => {
            const expectedError = new Error('threw an error');
            sandbox.stub(fakeVersionLock, 'create').throws(expectedError);
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);

            try {
                await osObject.createObject();
                assert.fail();
            } catch (error) {
                assert.strictEqual(error, expectedError);
            }
        });

        it('should return access details for the created object', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);

            assert.deepStrictEqual(
                await osObject.createObject(),
                {
                    storeId: osObject.storeId,
                    objectId: osObject.objectId,
                    version: expectedFirstVersion
                }
            );
        });
    });

    describe('#updateObject', () => {
        it('should attempt to acquire a version lock');
        it('should increment the version number');
        it('should throw an error if the lock cannot be obtained');

        it('should attempt to write the content');
        it('should attempt to write the metadata');
        it('should throw an error if the content write fails');
        it('should throw an error if the metadata write fails');
        it('should return access details for the created object version');
    });
});
