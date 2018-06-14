/* globals describe, it, beforeEach, afterEach */
'use strict';

const { promisify } = require('util');

const assert = require('assert');
const consola = require('consola');
const exists = promisify(require('fs').exists);
const logger = consola.withScope('OSBase');
const proxyquire = require('proxyquire');
const mkdirp = promisify(require('mkdirp'));
const sinon = require('sinon');
const uuid = require('uuid/v4');

// const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#OSBase', () => {
    let sandbox;
    let wrapper;
    let OSBase;
    let osBase;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        wrapper = {
            uuid,
            mkdirp,
            exists
        };

        OSBase = proxyquire('../src/OSBase', {
            'consola': { withScope: () => logger },
            'fs': { exists: function() { return wrapper.exists(...arguments); } },
            'mkdirp': function() { return wrapper.mkdirp(...arguments); },
            'uuid/v4': function() { return wrapper.uuid(...arguments); },
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
            sandbox.mock(wrapper)
                .expects('uuid')
                .withExactArgs()
                .once();

            osBase.generateId();

            sandbox.verify();
        });

        it('should return the generated uuid', () => {
            const expectedId = '123e4567-e89b-12d3-a456-426655440000';
            sandbox.stub(wrapper, 'uuid').returns(expectedId);

            assert.strictEqual(osBase.generateId(), expectedId);
        });
    });

    describe('#createDirectory', () => {
        beforeEach(() => {
            osBase = new OSBase();
        });

        it('should call "mkdirp" with the path', async () => {
            sandbox.mock(wrapper)
                .expects('mkdirp')
                .withExactArgs(
                    './expected/path/',
                    sinon.match.func
                )
                .once()
                .yields();

            await osBase.createDirectory('./expected/path/');

            sandbox.verify();
        });

        it('should return true if directories are successfully created', async () => {
            sandbox.stub(wrapper, 'mkdirp').yields();

            assert.strictEqual(await osBase.createDirectory('./expected/path/'), true);
        });

        it('should return false if directory creation fails', async () => {
            sandbox.stub(wrapper, 'mkdirp').yields('Error');

            assert.strictEqual(await osBase.createDirectory('./expected/path/'), false);
        });

        it('should log a fatal error if directory creation fails', async () => {
            sandbox.stub(wrapper, 'mkdirp').yields('Error');
            sandbox.mock(logger)
                .expects('fatal')
                .withExactArgs('Failed to create directory "./expected/path/" because of Error')
                .once();

            await osBase.createDirectory('./expected/path/');

            sandbox.verify();
        });
    });

    describe('#directoryExists', () => {
        beforeEach(() => {
            osBase = new OSBase();
        });

        it('should call "exists" with the path', async () => {
            sandbox.mock(wrapper)
                .expects('exists')
                .withExactArgs(
                    './expected/path/',
                    sinon.match.func
                )
                .once()
                .yields();

            await osBase.directoryExists('./expected/path/');

            sandbox.verify();
        });

        it('should return true if the directories exist', async () => {
            sandbox.stub(wrapper, 'exists').yields();

            assert.strictEqual(await osBase.directoryExists('./expected/path'), true);
        });

        it('should return false if any of the directories do not exist', async () => {
            sandbox.stub(wrapper, 'exists').yields('Error');

            assert.strictEqual(await osBase.directoryExists('./expected/path'), false);
        });
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
