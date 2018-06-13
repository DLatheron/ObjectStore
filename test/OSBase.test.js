/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid/v4');

describe('#OSBase', () => {
    let sandbox;
    let uuidWrapper;
    let OSBase;
    let osBase;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        uuidWrapper = {
            uuid
        };

        OSBase = proxyquire('../src/OSBase', {
            'uuid/v4': function() { return uuidWrapper.uuid(); }
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {
    });

    describe('#generateId', () => {
        beforeEach(() => {
            osBase = new OSBase();
        });

        it('should generate a v4 uuid', () => {
            sandbox.mock(uuidWrapper)
                .expects('uuid')
                .withExactArgs()
                .once();

            osBase.generateId();

            sandbox.verify();
        });

        it('should return the generated uuid', () => {
            const expectedId = '123e4567-e89b-12d3-a456-426655440000';
            sandbox.stub(uuidWrapper, 'uuid').returns(expectedId);

            assert.strictEqual(osBase.generateId(), expectedId);
        });
    });

    describe('#createDirectory', () => {
        it('should call "mkdirp" with the path');
        it('should return true if directories are successfully created');
        it('should return false if directory creation fails');
    });

    describe('#uuidToPath', () => {
        [
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [3, 4], expectedPath: '123/e456/' },
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [3, 3], expectedPath: '123/e45/' },
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [6, 6], expectedPath: '123e45/67e89b/' },
            { uuid: '123e4567e89b12d3a456426655440000', hierarchy: [6, 6], expectedPath: '123e45/67e89b/' },
            { uuid: '123e4567e89b12d3a456426655440000', hierarchy: [6, 6], pathSeparator: '\\', expectedPath: '123e45\\67e89b\\' }
        ]
            .forEach(({ uuid, hierarchy, pathSeparator = '/', expectedPath }) => {
                it(`should split uuid ${uuid} with hierarchy ${hierarchy} into path ${expectedPath} with separator ${pathSeparator}`, () => {
                    osBase = new OSBase();

                    assert.strictEqual(osBase.uuidToPath(uuid, hierarchy, pathSeparator), expectedPath);
                });
            });
    });
});
