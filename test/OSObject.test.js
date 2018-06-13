/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const { FakeLock, lockExpectations } = require('./helpers/FakeLock');
const ObjectDetails = require('../src/ObjectDetails');
const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#Object', () => {
    let sandbox;
    let OSObject;
    let osObject;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        OSObject = proxyquire('../src/OSObject', {
            './Lock': FakeLock
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#buildMetadataPath', () => {
        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
        });

        [
            { version: 1, expectedPath: './basePath/metadata.v000001.json' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(osObject.buildMetadataPath(version), expectedPath);
                });
            });
    });

    describe('#saveMetadata', () => {
        let writeFilePromise;

        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
            writeFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to write a file', () => {
            lockExpectations.setSimpleExpectations();

            sandbox.mock(osObject)
                .expects('writeFile')
                .withExactArgs(
                    './basePath/metadata.v000123.json',
                    'fileContent'
                )
                .once()
                .returns(writeFilePromise.fulfill());

            return osObject.saveMetadata('fileContent', 123)
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return true if the write succeeds', async () => {
            lockExpectations.setSimpleExpectations();

            sandbox.stub(osObject, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await osObject.saveMetadata('', 1), true);
        });

        it('should return false if the write fails', async () => {
            lockExpectations.setSimpleExpectations();

            sandbox.stub(osObject, 'writeFile').returns(writeFilePromise.reject('Test generated error'));

            assert.strictEqual(await osObject.saveMetadata('', 1), false);
        });
    });

    describe('#buildContentPath', () => {
        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
        });

        [
            { version: 1, expectedPath: './basePath/content.v000001.bin' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(osObject.buildContentPath(version), expectedPath);
                });
            });
    });

    describe('#saveContent', () => {
        let writeFilePromise;

        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
            writeFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to write a file', () => {
            sandbox.mock(osObject)
                .expects('writeFile')
                .withExactArgs(
                    './basePath/metadata.v000123.json',
                    'fileContent'
                )
                .once()
                .returns(writeFilePromise.fulfill());

            return osObject.saveContent('fileContent', 123)
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return true if the write succeeds', async () => {
            sandbox.stub(osObject, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await osObject.saveContent('', 1), true);
        });

        it('should return false if the write fails', async () => {
            sandbox.stub(osObject, 'writeFile').returns(writeFilePromise.reject('Test generated error'));

            assert.strictEqual(await osObject.saveContent('', 1), false);
        });
    });

    describe('#buildDetailsPath', () => {
        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
        });

        it('should build a path for details', () => {
            assert.strictEqual(osObject.buildDetailsPath(), './basePath/details.json');
        });
    });

    describe('#readDetails', () => {
        let readFilePromise;

        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
            readFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to read the file', () => {
            sandbox.mock(osObject)
                .expects('readFile')
                .withExactArgs(
                    './basePath/details.json'
                )
                .once()
                .returns(readFilePromise.fulfill(JSON.stringify({})));

            return osObject.readDetails()
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return the details if the read succeeds', async () => {
            sandbox.stub(osObject, 'readFile').returns(readFilePromise.fulfill('{}'));

            assert(await osObject.readDetails() instanceof ObjectDetails, 'Not an ObjectDetails');
        });

        it('should return false if the read fails', async () => {
            sandbox.stub(osObject, 'readFile').returns(readFilePromise.reject('Test generated error'));

            assert.strictEqual(await osObject.readDetails(), false);
        });

        it('should return false if the read fails because the file contents are not JSON', async () => {
            sandbox.stub(osObject, 'readFile').returns(readFilePromise.fulfill(''));

            assert.strictEqual(await osObject.readDetails(), false);
        });
    });

    describe('#writeDetails', () => {
        let writeFilePromise;

        beforeEach(() => {
            osObject = new OSObject('objectId', './basePath/');
            writeFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to write the file as JSON with a utf8 encoding', () => {
            sandbox.mock(osObject)
                .expects('writeFile')
                .withExactArgs(
                    './basePath/details.json',
                    '{\n    "latestVersion": 11\n}',
                    'utf8'
                )
                .once()
                .returns(writeFilePromise.fulfill());

            return osObject.writeDetails({ latestVersion: 11 })
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return the true if the write succeeds', async () => {
            sandbox.stub(osObject, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await osObject.writeDetails(), true);
        });

        it('should return false if the write fails', async () => {
            sandbox.stub(osObject, 'writeFile').returns(writeFilePromise.reject('Test generated error'));

            assert.strictEqual(await osObject.writeDetails(), false);
        });
    });
});
