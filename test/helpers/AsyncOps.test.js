/* globals describe, it, beforeEach, afterEach */
'use strict';

const { promisify } = require('util');

const assert = require('assert');
const consola = require('consola');
const logger = consola.withScope('AsyncOps');
const exists = promisify(require('fs').exists);
const proxyquire = require('proxyquire');
const mkdirp = promisify(require('mkdirp'));
const sinon = require('sinon');

describe('#AsyncOps', () => {
    let sandbox;
    let wrapper;
    let AsyncOps;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        wrapper = {
            mkdirp,
            exists
        };

        AsyncOps = proxyquire('../../src/helpers/AsyncOps', {
            'consola': { withScope: () => logger },
            'fs': { exists: function() { return wrapper.exists(...arguments); } },
            'mkdirp': function() { return wrapper.mkdirp(...arguments); },
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#OpenFile', () => {
        it('should asynchronously call fs.open');
        it('should return the file handle returned by fs.open');
        it('should throw an error if fs.open fails');
    });

    describe('#SafeOpenFile', () => {
        it('should asynchronously call AsyncOps.OpenFile');
        it('should return the file handle returned by AsyncOps.OpenFile');
        it('should return null if AsyncOps.OpenFile throws an error');
    });

    describe('#CloseFile', () => {
        it('should asynchronously call fs.close');
        it('should return if fs.close completes');
        it('should throw an error if fs.close fails');
    });

    describe('#DeleteFile', () => {
    });

    describe('#ReadFile', () => {
    });

    describe('#WriteFile', () => {
    });

    describe('#WriteWholeFile', () => {
    });

    describe('#Stat', () => {
    });

    describe('#GetFileSize', () => {
    });

    describe('#CreateDirectory', () => {
        it('should call "mkdirp" with the path', async () => {
            sandbox.mock(wrapper)
                .expects('mkdirp')
                .withExactArgs(
                    './expected/path/',
                    sinon.match.func
                )
                .once()
                .yields();

            await AsyncOps.CreateDirectory('./expected/path/');

            sandbox.verify();
        });

        it('should return true if directories are successfully created', async () => {
            sandbox.stub(wrapper, 'mkdirp').yields();

            assert.strictEqual(await AsyncOps.CreateDirectory('./expected/path/'), true);
        });

        it('should return false if directory creation fails', async () => {
            sandbox.stub(wrapper, 'mkdirp').yields('Error');

            assert.strictEqual(await AsyncOps.CreateDirectory('./expected/path/'), false);
        });

        it('should log a fatal error if directory creation fails', async () => {
            sandbox.stub(wrapper, 'mkdirp').yields('Error');
            sandbox.mock(logger)
                .expects('fatal')
                .withExactArgs('Failed to create directory "./expected/path/" because of Error')
                .once();

            await AsyncOps.CreateDirectory('./expected/path/');

            sandbox.verify();
        });
    });

    describe('#DirectoryExists', () => {
        it('should call "exists" with the path', async () => {
            sandbox.mock(wrapper)
                .expects('exists')
                .withExactArgs(
                    './expected/path/',
                    sinon.match.func
                )
                .once()
                .yields();

            await AsyncOps.DirectoryExists('./expected/path/');

            sandbox.verify();
        });

        it('should return true if the directories exist', async () => {
            sandbox.stub(wrapper, 'exists').yields();

            assert.strictEqual(await AsyncOps.DirectoryExists('./expected/path'), true);
        });

        it('should return false if any of the directories do not exist', async () => {
            sandbox.stub(wrapper, 'exists').yields('Error');

            assert.strictEqual(await AsyncOps.DirectoryExists('./expected/path'), false);
        });
    });

    describe('#WaitForTimeout', () => {
    });
});
