/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const VersionLock = require('../src/VersionLock');
// const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#Object', () => {
    let sandbox;
    let OSObject;
    let osObject;

    beforeEach(() => {
        sandbox = sinon.createSandbox();

        OSObject = proxyquire('../src/OSObject', {
            './VersionLock': VersionLock
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#_buildMetadataPath', () => {
        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');
        });

        [
            { version: 1, expectedPath: './basePath/metadata.v000001.json' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(osObject._buildMetadataPath(version), expectedPath);
                });
            });
    });

    describe('#_updateMetadata', () => {
        it('should generate a version specific filename');
        it('should attempt to write the metadata');
        it('should not attempt to write anything if no metadata is supplied');
    });

    describe('#_buildContentPath', () => {
        beforeEach(() => {
            osObject = new OSObject('storeId', 'objectId', './basePath/');
        });

        [
            { version: 1, expectedPath: './basePath/content.v000001.bin' }
        ]
            .forEach(({ version, expectedPath }) => {
                it(`should build a path for version ${version} of the metadata as ${expectedPath}`, () => {
                    assert.strictEqual(osObject._buildContentPath(version), expectedPath);
                });
            });
    });

    describe('#_updateContent', () => {
        it('should generate a version specific filename');
        it('should attempt to write the content');
        it('should not attempt to write anything if no content is supplied');
    });

    describe('#createObject', () => {
        it('should attempt to acquire a version lock');
        it('should throw an error if the lock cannot be created');
        it('should return access details for the created object');
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
