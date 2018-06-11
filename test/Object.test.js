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
    let Object;
    let object;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        Object = proxyquire('../src/Object', {
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
            object = new Object('./basePath/');
        });

        [
            { version: 1, expectedPath: './basePath/metadata.v000001.json' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(object.buildMetadataPath(version), expectedPath);
                });
            });
    });

    describe('#saveMetadata', () => {
        let writeFilePromise;

        beforeEach(() => {
            object = new Object('./basePath/');
            writeFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to write a file', () => {
            lockExpectations.setSimpleExpectations();

            sandbox.mock(object)
                .expects('writeFile')
                .withExactArgs(
                    './basePath/metadata.v000123.json',
                    'fileContent'
                )
                .once()
                .returns(writeFilePromise.fulfill());

            return object.saveMetadata('fileContent', 123)
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return true if the write succeeds', async () => {
            lockExpectations.setSimpleExpectations();

            sandbox.stub(object, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await object.saveMetadata('', 1), true);
        });

        it('should return false if the write fails', async () => {
            lockExpectations.setSimpleExpectations();

            sandbox.stub(object, 'writeFile').returns(writeFilePromise.reject('Test generated error'));

            assert.strictEqual(await object.saveMetadata('', 1), false);
        });
    });

    describe('#buildContentPath', () => {
        beforeEach(() => {
            object = new Object('./basePath/');
        });

        [
            { version: 1, expectedPath: './basePath/content.v000001.bin' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(object.buildContentPath(version), expectedPath);
                });
            });
    });

    describe('#saveContent', () => {
        let writeFilePromise;

        beforeEach(() => {
            object = new Object('./basePath/');
            writeFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to write a file', () => {
            sandbox.mock(object)
                .expects('writeFile')
                .withExactArgs(
                    './basePath/metadata.v000123.json',
                    'fileContent'
                )
                .once()
                .returns(writeFilePromise.fulfill());

            return object.saveContent('fileContent', 123)
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return true if the write succeeds', async () => {
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await object.saveContent('', 1), true);
        });

        it('should return false if the write fails', async () => {
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.reject('Test generated error'));

            assert.strictEqual(await object.saveContent('', 1), false);
        });
    });

    describe('#buildDetailsPath', () => {
        beforeEach(() => {
            object = new Object('./basePath/');
        });

        it('should build a path for details', () => {
            assert.strictEqual(object.buildDetailsPath(), './basePath/details.json');
        });
    });

    describe('#readDetails', () => {
        let readFilePromise;

        beforeEach(() => {
            object = new Object('./basePath/');
            readFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to read the file', () => {
            sandbox.mock(object)
                .expects('readFile')
                .withExactArgs(
                    './basePath/details.json'
                )
                .once()
                .returns(readFilePromise.fulfill(JSON.stringify({})));

            return object.readDetails()
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return the details if the read succeeds', async () => {
            sandbox.stub(object, 'readFile').returns(readFilePromise.fulfill('{}'));

            assert(await object.readDetails() instanceof ObjectDetails, 'Not an ObjectDetails');
        });

        it('should return false if the read fails', async () => {
            sandbox.stub(object, 'readFile').returns(readFilePromise.reject('Test generated error'));

            assert.strictEqual(await object.readDetails(), false);
        });

        it('should return false if the read fails because the file contents are not JSON', async () => {
            sandbox.stub(object, 'readFile').returns(readFilePromise.fulfill(''));

            assert.strictEqual(await object.readDetails(), false);
        });
    });

    describe('#writeDetails', () => {
        let writeFilePromise;

        beforeEach(() => {
            object = new Object('./basePath/');
            writeFilePromise = UnitTestHelper.createPromise();
        });

        it('should attempt to write the file as JSON with a utf8 encoding', () => {
            sandbox.mock(object)
                .expects('writeFile')
                .withExactArgs(
                    './basePath/details.json',
                    '{\n    "latestVersion": 11\n}',
                    'utf8'
                )
                .once()
                .returns(writeFilePromise.fulfill());

            return object.writeDetails({ latestVersion: 11 })
                .then(() => {
                    sandbox.verify();
                });
        });

        it('should return the true if the write succeeds', async () => {
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await object.writeDetails(), true);
        });

        it('should return false if the write fails', async () => {
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.reject('Test generated error'));

            assert.strictEqual(await object.writeDetails(), false);
        });
    });
});
