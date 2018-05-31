/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const sinon = require('sinon');

const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#Object', () => {
    let sandbox;
    let Object;
    let object;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        Object = require('../src/Object');

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
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.fulfill());

            assert.strictEqual(await object.saveMetadata('', 1), true);
        });

        it('should return false if the write fails', async () => {
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.reject());

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
            sandbox.stub(object, 'writeFile').returns(writeFilePromise.reject());

            assert.strictEqual(await object.saveContent('', 1), false);
        });
    });
});
