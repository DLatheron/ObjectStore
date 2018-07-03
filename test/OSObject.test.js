/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const fs = require('fs');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const { Reasons, OSError } = require('../src/OSError');
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

        it('should create a new version lock', async () => {
            sandbox.mock(wrapper)
                .expects('VersionLock')
                .withExactArgs(osObject.basePath)
                .once()
                .returns(fakeVersionLock);

            await osObject.createObject();

            sandbox.verify();
        });

        it(`should attempt to create a version lock start at version ${expectedFirstVersion}`, async () => {
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
        let fakeVersionLock;
        let testStream;
        let testMetadata;

        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');

            fakeVersionLock = {
                getContents: () => { return { latestVerstion: 0 }; }
            };
            testStream = {
                message: 'this is a test stream'
            };
            testMetadata = {
                message: 'this is some test metadata'
            };
        });

        it('should create a new version lock', async () => {
            sandbox.mock(wrapper)
                .expects('VersionLock')
                .withExactArgs(osObject.basePath)
                .once()
                .returns(fakeVersionLock);
            sandbox.stub(osObject, '_updateContent');
            sandbox.stub(osObject, '_updateMetadata');

            await osObject.updateObject();

            sandbox.verify();
        });

        it('should increment the version number', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.mock(fakeVersionLock)
                .expects('getContents')
                .withExactArgs({ latestVersion: sinon.match.func })
                .once()
                .returns({ latestVersion: 1 });
            sandbox.stub(osObject, '_updateContent');
            sandbox.stub(osObject, '_updateMetadata');

            await osObject.updateObject();

            sandbox.verify();
        });

        it('should throw an error if the lock cannot be obtained', async () => {
            const expectedError = new Error('getContents threw this error');

            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.stub(fakeVersionLock, 'getContents').throws(expectedError);

            try {
                await osObject.updateObject();
                assert.fail();
            } catch (error) {
                assert.strictEqual(error, expectedError);
            }
        });

        it('should attempt to write the content', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.stub(fakeVersionLock, 'getContents').returns({ latestVersion: 14 });
            sandbox.mock(osObject)
                .expects('_updateContent')
                .withExactArgs(14, testStream)
                .once();
            sandbox.stub(osObject, '_updateMetadata');

            await osObject.updateObject(testStream);

            sandbox.verify();
        });

        it('should attempt to write the metadata', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.stub(fakeVersionLock, 'getContents').returns({ latestVersion: 57 });
            sandbox.stub(osObject, '_updateContent');
            sandbox.mock(osObject)
                .expects('_updateMetadata')
                .withExactArgs(57, testMetadata)
                .once();

            await osObject.updateObject(undefined, testMetadata);

            sandbox.verify();
        });

        it('should throw an error if the content write fails', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.stub(fakeVersionLock, 'getContents').returns({ latestVersion: 14 });
            sandbox.stub(osObject, '_updateContent').throws('Any error');

            try {
                await osObject.updateObject();
                assert.fail();
            } catch (error) {
                assert.deepStrictEqual(
                    error,
                    new OSError(Reasons.ContentWriteError, {
                        storeId: osObject.storeId,
                        objectId: osObject.objectId
                    })
                );
            }
        });

        it('should throw an error if the metadata write fails', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.stub(fakeVersionLock, 'getContents').returns({ latestVersion: 14 });
            sandbox.stub(osObject, '_updateContent');
            sandbox.stub(osObject, '_updateMetadata').throws('Any error');

            try {
                await osObject.updateObject();
                assert.fail();
            } catch (error) {
                assert.deepStrictEqual(
                    error,
                    new OSError(Reasons.ContentWriteError, {
                        storeId: osObject.storeId,
                        objectId: osObject.objectId
                    })
                );
            }
        });

        it('should return access details for the created object version', async () => {
            sandbox.stub(wrapper, 'VersionLock').returns(fakeVersionLock);
            sandbox.stub(fakeVersionLock, 'getContents').returns({ latestVersion: 37 });
            sandbox.stub(osObject, '_updateContent');
            sandbox.stub(osObject, '_updateMetadata');

            assert.deepStrictEqual(
                await osObject.updateObject(),
                {
                    storeId: osObject.storeId,
                    objectId: osObject.objectId,
                    version: 37
                }
            );
        });
    });
});
