/* globals describe, it, beforeEach, afterEach */
'use strict';

const { promisify } = require('util');

const assert = require('assert');
const consola = require('consola');
const logger = consola.withScope('AsyncOps');
const proxyquire = require('proxyquire');
const mkdirp = promisify(require('mkdirp'));
const sinon = require('sinon');

describe('#AsyncOps', () => {
    let sandbox;
    let now;
    let clock;
    let wrapper;
    let AsyncOps;
    let expectedResult;
    let expectedError;
    let originalSetTimeout;

    function buildIntermediate(wrapper) {
        const intermediateWrapper = {};

        Object.keys(wrapper).forEach(key => {
            intermediateWrapper[key] = function() {
                return wrapper[key](...arguments);
            };
        });

        return intermediateWrapper;
    }

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        now = Date.now();
        clock = sandbox.useFakeTimers(now);

        wrapper = {
            mkdirp,
            open: () => {},
            close: () => {},
            unlink: () => {},
            read: () => {},
            write: () => {},
            writeFile: () => {},
            fstat: () => {},
            exists: () => {},
            setTimeout
        };
        expectedResult = {
            message: 'a fake result was returned',
            isSameInstance: true
        };
        expectedError = {
            message: 'an expected error occurred',
            isSameInstance: true
        };

        originalSetTimeout = global.setTimeout;
        global.setTimeout = function() {
            return wrapper.setTimeout(...arguments);
        };

        AsyncOps = proxyquire('../../src/helpers/AsyncOps', {
            'consola': { withScope: () => logger },
            'fs': buildIntermediate(wrapper),
            'mkdirp': function() { return wrapper.mkdirp(...arguments); },
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        clock.restore();
        sandbox.restore();

        global.setTimeout = originalSetTimeout;
    });

    [
        {
            operation: 'OpenFile',
            wrappedOp: 'open',
            parameters: ['path', 'mode'],
            expectedReturnValue: 'handle'
        }, {
            operation: 'CloseFile',
            wrappedOp: 'close',
            parameters: ['handle'],
            expectedReturnValue: undefined
        }, {
            operation: 'DeleteFile',
            wrappedOp: 'unlink',
            parameters: ['path'],
            expectedReturnValue: undefined
        }, {
            operation: 'ReadFile',
            wrappedOp: 'read',
            parameters: ['handle', 'buffer', 'offset', 'length', 'position'],
            expectedReturnValue: 'results'
        }, {
            operation: 'WriteFile',
            wrappedOp: 'write',
            parameters: ['handle', 'buffer', 'offset', 'length', 'position'],
            expectedReturnValue: 'results'
        }, {
            operation: 'WriteWholeFile',
            wrappedOp: 'writeFile',
            parameters: ['path', 'data', 'options'],
            expectedReturnValue: 'results'
        }, {
            operation: 'Stat',
            wrappedOp: 'fstat',
            parameters: ['handle'],
            expectedReturnValue: 'details'
        }
    ]
        .forEach(({ operation, wrappedOp, parameters, expectedReturnValue }) => {
            describe(`#${operation}`, () => {
                it(`should asynchronously call fs.${wrappedOp}`, async () => {
                    sandbox.mock(wrapper)
                        .expects(wrappedOp)
                        .withExactArgs(
                            ...parameters,
                            sinon.match.func
                        )
                        .once()
                        .yields();

                    await AsyncOps[operation](...parameters);

                    sandbox.verify();
                });

                it(`should return the value ${expectedReturnValue} returned by fs.${wrappedOp}`, async () => {
                    sandbox.stub(wrapper, wrappedOp).yields(null, expectedResult);

                    assert.strictEqual(await AsyncOps[operation](...parameters), expectedResult);
                });

                it(`should throw an error if fs.${wrappedOp} fails`, async () => {
                    sandbox.stub(wrapper, wrappedOp).yields(expectedError);

                    try {
                        await AsyncOps[operation](...parameters);
                        assert.fail();
                    } catch (error) {
                        assert.strictEqual(error, expectedError);
                    }
                });
            });
        });

    describe('#SafeOpenFile', () => {
        it('should asynchronously call AsyncOps.OpenFile', async () => {
            sandbox.mock(AsyncOps)
                .expects('OpenFile')
                .withExactArgs('filename', 'mode')
                .once();

            await AsyncOps.SafeOpenFile('filename', 'mode');

            sandbox.verify();
        });

        it('should return the file handle returned by AsyncOps.OpenFile', async () => {
            sandbox.stub(AsyncOps, 'OpenFile').returns(expectedResult);

            assert.strictEqual(await AsyncOps.SafeOpenFile('filename', 'mode'), expectedResult);
        });

        it('should return null if AsyncOps.OpenFile throws an error', async () => {
            sandbox.stub(AsyncOps, 'OpenFile').throws(expectedError);

            assert.strictEqual(await AsyncOps.SafeOpenFile('filename', 'mode'), null);
        });
    });

    describe('#GetFileSize', () => {
        it('should asynchronously call AsyncOps.Stat', async () => {
            sandbox.mock(AsyncOps)
                .expects('Stat')
                .withExactArgs('handle')
                .once()
                .returns({
                    size: 1234
                });

            await AsyncOps.GetFileSize('handle');

            sandbox.verify();
        });

        it('should return the file handle returned by AsyncOps.Stat', async () => {
            sandbox.stub(AsyncOps, 'Stat').returns({
                size: 4567
            });

            assert.strictEqual(await AsyncOps.GetFileSize('handle'), 4567);
        });

        it('should throw an error if AsyncOps.Stat throws an error', async () => {
            sandbox.stub(AsyncOps, 'Stat').throws(expectedError);

            try {
                await AsyncOps.GetFileSize('handle');
                assert.fail();
            } catch (error) {
                assert.strictEqual(error, expectedError);
            }
        });
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
        it('should call "setTimeout" with requested timeout in milliseconds', async () => {
            sandbox.mock(wrapper)
                .expects('setTimeout')
                .once()
                .withExactArgs(
                    sinon.match.func,
                    1234
                )
                .yields();

            AsyncOps.WaitForTimeout(1234);
        });

        it('should return after the requested number of milliseconds has elapsed', (done) => {
            (async () => {
                await AsyncOps.WaitForTimeout(100);
                done();
            })();

            clock.tick(100);
        });

        it('should throw an error if one occurs', async () => {
            sandbox.stub(wrapper, 'setTimeout').throws(expectedError);

            try {
                await AsyncOps.WaitForTimeout(1234);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error, expectedError);
            }
        });
    });
});
