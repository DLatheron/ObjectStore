/* globals console, describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const { Reasons } = require('../src/OSError');

describe('#VersionLock', () => {
    let sandbox;
    let now;
    let clock;
    let VersionLock;
    let versionLock;
    let fakeFileHandle;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        now = new Date();
        clock = sinon.useFakeTimers(now.getTime());

        VersionLock =  proxyquire('../src/VersionLock', {
            './helpers/AsyncOps': AsyncOps
        });

        fakeFileHandle = 0xdeadbeef;
    });

    afterEach(() => {
        sandbox.verify();
        clock.restore();
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should generate the name of the lock file', () => {
            const lock = new VersionLock('./subdir/path/');

            assert.strictEqual(lock.lockFilePath, './subdir/path/.lockFile');
        });

        it('should generate the name of the lock file if overridden', () => {
            const lock = new VersionLock('./subdir/path/', {
                lockFilename: '.newLockFile'
            });

            assert.strictEqual(lock.lockFilePath, './subdir/path/.newLockFile');
        });

        context('options', () => {
            [
                { optionName: 'retryInterval', defaultValue: 100, overriddenValue: 200 },
                { optionName: 'waitTimeout', defaultValue: 1000, overriddenValue: 5000 },
                { optionName: 'lockFilename', defaultValue: '.lockFile', overriddenValue: '.newLockFile' }
            ]
                .forEach(({ optionName, defaultValue, overriddenValue}) => {
                    it(`should default '${optionName}' = ${defaultValue} as type ${typeof defaultValue}`, () =>{
                        const lock = new VersionLock();

                        assert.strictEqual(lock.options[optionName], defaultValue);
                    });

                    it('should merge the options', () => {
                        it(`should all '${optionName}' to be overridden to ${overriddenValue}`, () => {
                            const lock = new VersionLock('.', {
                                [optionName]: overriddenValue
                            });

                            assert.strictEqual(lock.options[optionName], overriddenValue);
                        });
                    });
                });
        });
    });

    describe('#getContents', () => {
        beforeEach(() => {
            versionLock = new VersionLock();
        });

        it('should attempt to open the lock file', async () => {
            sandbox.mock(versionLock)
                .expects('_tryToOpenLockFile')
                .withExactArgs(now.getTime())
                .once();
            sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 0 });
            sandbox.stub(versionLock, '_performModifications').returns({ latestVersion: 1 });
            sandbox.stub(versionLock, '_writeLockFile');
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents();
        });

        it('should return the contents of the lock file if it was successfully opened, read, updated and written', async () => {
            const contents = {
                latestVersion: 17,
                otherKey: 'Here'
            };

            sandbox.mock(versionLock)
                .expects('_tryToOpenLockFile')
                .withExactArgs(now.getTime())
                .once();
            sandbox.stub(versionLock, '_readLockFile').returns(contents);
            sandbox.stub(versionLock, '_performModifications').returns(contents);
            sandbox.stub(versionLock, '_writeLockFile');
            sandbox.stub(AsyncOps, 'CloseFile');

            assert.strictEqual(await versionLock.getContents(), contents);

            sandbox.verify();
        });

        it('should throw an error if the lock file cannot be opened', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').callsFake(() => {
                throw new Error('_tryToOpenLockFile threw this');
            });
            sandbox.mock(versionLock).expects('_readLockFile').never();
            sandbox.mock(versionLock).expects('_performModifications').never();
            sandbox.mock(versionLock).expects('_writeLockFile').never();
            sandbox.mock(AsyncOps).expects('CloseFile').never();

            try {
                assert.strictEqual(await versionLock.getContents(), undefined);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error.reason, Reasons.LockCouldNotBeAcquired);
            }

            sandbox.verify();
        });

        it('should attempt to read the lock file', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.mock(versionLock)
                .expects('_readLockFile')
                .withExactArgs(fakeFileHandle)
                .once()
                .returns({ latestVersion: 17 });
            sandbox.stub(versionLock, '_performModifications').returns({ latestVersion: 18 });
            sandbox.stub(versionLock, '_writeLockFile');
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents();

            sandbox.verify();
        });

        it('should throw an error if the lock file cannot be read', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').callsFake(() => {
                throw new Error('_readLockFile threw this');
            });
            sandbox.mock(versionLock).expects('_performModifications').never();
            sandbox.mock(versionLock).expects('_writeLockFile').never();
            sandbox.stub(AsyncOps, 'CloseFile');

            try {
                assert.strictEqual(await versionLock.getContents(), undefined);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error.reason, Reasons.LockFileIsCorrupt);
            }

            sandbox.verify();
        });

        it('should attempt to close the file if the lock file could not be read', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').callsFake(() => {
                throw new Error('_readLockFile threw this');
            });
            sandbox.mock(AsyncOps)
                .expects('CloseFile')
                .withExactArgs(fakeFileHandle)
                .once();

            try {
                await versionLock.getContents();
                assert.fail();
            } catch (error) {
                // Do nothing.
            }

            sandbox.verify();
        });

        it('should attempt to update the contents of the lock file', async () => {
            const contents = {
                latestVersion: 8521
            };
            const modifications = {
                latestVersion: () => {}
            };
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns(contents);
            sandbox.mock(versionLock)
                .expects('_performModifications')
                .withExactArgs(
                    contents,
                    modifications
                )
                .once();
            sandbox.stub(versionLock, '_writeLockFile');
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents(modifications);

            sandbox.verify();
        });

        it('should leave the lock file contents unchanged if no modifications are requested', async () => {
            const contents = {
                latestVersion: 8521
            };
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns(contents);
            sandbox.mock(versionLock)
                .expects('_writeLockFile')
                .withExactArgs(
                    fakeFileHandle,
                    contents
                )
                .once();
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents();

            sandbox.verify();
        });

        it('should increment the latest version if modifications are requested', async () => {
            const latestVersion = 1269;
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion });
            sandbox.mock(versionLock)
                .expects('_writeLockFile')
                .withExactArgs(
                    fakeFileHandle,
                    { latestVersion: latestVersion + 1 }
                )
                .once();
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents({
                latestVersion: version => version + 1
            });

            sandbox.verify();
        });

        it('should increase the latest version of the file read', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 3456 });
            sandbox.stub(versionLock, '_performModifications').returns({ latestVersion: 3457 });
            sandbox.mock(versionLock)
                .expects('_writeLockFile')
                .withExactArgs(
                    fakeFileHandle,
                    { latestVersion: 3457 }
                )
                .once();
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents();

            sandbox.verify();
        });

        it('should attempt to write the lock file', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 3456 });
            sandbox.stub(versionLock, '_performModifications').returns({ latestVersion: 3457 });
            sandbox.mock(versionLock)
                .expects('_writeLockFile')
                .withExactArgs(
                    fakeFileHandle,
                    sinon.match.object
                )
                .once();
            sandbox.stub(AsyncOps, 'CloseFile');

            await versionLock.getContents();

            sandbox.verify();
        });

        it('should throw an error if the lock file cannot be written', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 1 });
            sandbox.stub(versionLock, '_performModifications').returns({ latestVersion: 2 });
            sandbox.stub(versionLock, '_writeLockFile').callsFake(() => {
                throw new Error('_writeLockFile threw this');
            });
            sandbox.stub(AsyncOps, 'CloseFile');

            try {
                assert.strictEqual(await versionLock.getContents(), undefined);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error.reason, Reasons.LockCouldNotBeWritten);
            }
        });

        it('should attempt to close the file if the lock file could not be written', async () => {
            sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
            sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 1 });
            sandbox.stub(versionLock, '_performModifications').returns({ latestVersion: 2 });
            sandbox.stub(versionLock, '_writeLockFile').callsFake(() => {
                throw new Error('_writeLockFile threw this');
            });
            sandbox.mock(AsyncOps)
                .expects('CloseFile')
                .withExactArgs(fakeFileHandle)
                .once();

            try {
                assert.strictEqual(await versionLock.getContents(), undefined);
                assert.fail();
            } catch (error) {
                // Ignore throw.
            }

            sandbox.verify();
        });
    });

    describe('#_tryToOpenLockFile', () => {
        beforeEach(() => {
            versionLock = new VersionLock();
        });

        it('should attempt to safely open the lock file', async () => {
            sandbox.mock(AsyncOps)
                .expects('SafeOpenFile')
                .withExactArgs(
                    versionLock.lockFilePath,
                    'wx+'
                )
                .once()
                .returns(fakeFileHandle);

            await versionLock._tryToOpenLockFile(now);

            sandbox.verify();
        });

        it('should attempt to wait if the file open fails first time', async () => {
            sandbox.stub(AsyncOps, 'SafeOpenFile')
                .onCall(0).returns(null)
                .onCall(1).returns(fakeFileHandle);
            sandbox.mock(AsyncOps)
                .expects('WaitForTimeout')
                .withExactArgs(versionLock.options.retryInterval)
                .once();

            await versionLock._tryToOpenLockFile(now);

            sandbox.verify();
        });

        it('should retry opening the file after the wait', async () => {
            let secondCall = false;
            sandbox.stub(AsyncOps, 'SafeOpenFile')
                .onCall(0).returns(null)
                .onCall(1).callsFake(() => {
                    secondCall = true;
                })
                .returns(fakeFileHandle);
            sandbox.stub(AsyncOps, 'WaitForTimeout');

            await versionLock._tryToOpenLockFile(now);

            assert.strictEqual(secondCall, true);
        });

        it('should retry until the wait timeout is exceeded and then throw an error', async () => {
            let tick = 0;
            sandbox.stub(AsyncOps, 'SafeOpenFile').returns(null);
            sandbox.stub(AsyncOps, 'WaitForTimeout').callsFake(() => {
                tick += versionLock.options.retryInterval;
                clock.tick(tick);
            });

            try {
                await versionLock._tryToOpenLockFile(0);
                assert.fail();
            } catch (error) {
                assert.deepStrictEqual(
                    error.message,
                    `Attempt to acquire lock on "${versionLock.lockFilePath}" timed out (> ${versionLock.options.waitTimeout}ms)`
                );
            }
        });

        it('should return the file handle', async () => {
            sandbox.stub(AsyncOps, 'SafeOpenFile').returns(fakeFileHandle);

            assert.strictEqual(await versionLock._tryToOpenLockFile(), fakeFileHandle);
        });
    });

    describe('#_readLockFile', () => {
        let fakeLegalJson;
        let fakeLegalJsonBuffer;
        let fakeIllegalJson;
        let fakeIllegalJsonBuffer;

        beforeEach(() => {
            versionLock = new VersionLock();

            fakeLegalJson = JSON.stringify({ latestVersion: 345 });
            fakeLegalJsonBuffer = new Buffer(fakeLegalJson, 'utf8');

            fakeIllegalJson = '{ "latestVersion": 632';   // Missing terminating brace.
            fakeIllegalJsonBuffer = new Buffer(fakeIllegalJson, 'utf8');
        });

        it('should attempt to size the lock file', async () => {
            sandbox.mock(AsyncOps)
                .expects('GetFileSize')
                .withExactArgs(versionLock.lockFilePath)
                .once()
                .returns(0);
            sandbox.stub(AsyncOps, 'ReadFile').returns({ bytesRead: 0 });
            sandbox.stub(JSON, 'parse');

            await versionLock._readLockFile(fakeFileHandle);

            sandbox.verify();
        });

        it('should attempt to read the lock file', async () => {
            sandbox.stub(AsyncOps, 'GetFileSize').returns(fakeLegalJsonBuffer.length);
            sandbox.mock(AsyncOps)
                .expects('ReadFile')
                .once()
                .returns({ bytesRead: fakeLegalJsonBuffer.length });
            sandbox.stub(JSON, 'parse');

            await versionLock._readLockFile(fakeFileHandle);

            sandbox.verify();
        });

        it('should throw an error if the lock file is not of the expected size when read', async () => {
            sandbox.stub(AsyncOps, 'GetFileSize').returns(27);
            sandbox.mock(AsyncOps)
                .expects('ReadFile')
                .once()
                .returns({ bytesRead: 23 });
            sandbox.stub(JSON, 'parse');

            try {
                await versionLock._readLockFile(fakeFileHandle);
                assert.fail();
            } catch (error) {
                assert.strictEqual(
                    error.message,
                    `Lock file "${versionLock.lockFilePath}" was 23 bytes when it was expected to be 27 bytes`
                );
            }

            sandbox.verify();
        });

        it('should attempt to parse the contents of the file as JSON', async () => {
            sandbox.stub(AsyncOps, 'GetFileSize').returns(fakeLegalJsonBuffer.length);
            sandbox.stub(AsyncOps, 'ReadFile').callsFake((_, buffer) => {
                buffer.write(fakeLegalJson);
                return {
                    bytesRead: fakeLegalJsonBuffer.length
                };
            });
            sandbox.mock(JSON)
                .expects('parse')
                .withExactArgs(fakeLegalJson)
                .once();

            await versionLock._readLockFile(fakeFileHandle);

            sandbox.verify();
        });

        it('should throw an error if the file is not valid JSON', async () => {
            sandbox.stub(AsyncOps, 'GetFileSize').returns(fakeIllegalJsonBuffer.length);
            sandbox.stub(AsyncOps, 'ReadFile').callsFake((_, buffer) => {
                buffer.write(fakeIllegalJson);
                return {
                    bytesRead: fakeIllegalJsonBuffer.length
                };
            });

            try {
                await versionLock._readLockFile(fakeFileHandle);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error.message, 'Unexpected end of JSON input');
            }
        });
    });

    describe('#_writeLockFile', () => {
        let fakeContents;
        let fakeContentsAsJson;
        let fakeContentsInBuffer;

        beforeEach(() => {
            versionLock = new VersionLock();
            fakeContents = {
                latestVersion: 252,
                otherKey: 'Hello',
                boolean: true
            };
            fakeContentsAsJson = JSON.stringify(fakeContents);
            fakeContentsInBuffer = new Buffer(fakeContentsAsJson, 'utf8');
        });

        it('should convert the contents to JSON', async () => {
            sandbox.mock(JSON)
                .expects('stringify')
                .withExactArgs(fakeContents)
                .once()
                .returns(fakeContentsAsJson);
            sandbox.stub(AsyncOps, 'WriteFile').returns({ bytesWritten: fakeContentsInBuffer.length });

            await versionLock._writeLockFile(fakeFileHandle, fakeContents);

            sandbox.verify();
        });

        it('should attempt to the write the contents to the lock file', async () => {
            sandbox.mock(AsyncOps)
                .expects('WriteFile')
                .withExactArgs(
                    fakeFileHandle,
                    fakeContentsInBuffer
                )
                .once()
                .returns({ bytesWritten: fakeContentsInBuffer.length });

            await versionLock._writeLockFile(fakeFileHandle, fakeContents);

            sandbox.verify();
        });

        it('should throw an error if the file cannot be written', async () => {
            sandbox.stub(AsyncOps, 'WriteFile').throws(new Error('WriteFile threw this'));

            try {
                await versionLock._writeLockFile(fakeFileHandle, fakeContents);
                assert.fail();
            } catch (error) {
                assert.strictEqual(error.message, 'WriteFile threw this');
            }
        });

        it('should throw an error if the file is not of the expected size', async () => {
            sandbox.stub(AsyncOps, 'WriteFile').returns({ bytesWritten: 17 });

            try {
                await versionLock._writeLockFile(fakeFileHandle, fakeContents);
                assert.fail();
            } catch (error) {
                assert.strictEqual(
                    error.message,
                    `Lock file "${versionLock.lockFilePath}" was 17 bytes not the expected size ${fakeContentsInBuffer.length} bytes`
                );
            }
        });
    });

    describe('#_performModifications', () => {
        beforeEach(() => {
            versionLock = new VersionLock();
        });

        it('should return the original contents if there no modifications are requested', () => {
            const originalContents = {
                decrement: 6000,
                increment: 3449,
                doNotModify: 'Do not change this',
                replaceMe: 'With something else'
            };

            assert.strictEqual(versionLock._performModifications(originalContents), originalContents);
            assert.strictEqual(versionLock._performModifications(originalContents, null), originalContents);
            assert.strictEqual(versionLock._performModifications(originalContents, undefined), originalContents);
        });

        [
            {
                description: 'a direct replacement',
                original: 'Original Data',
                modification: 'Modified Data',
                expected: 'Modified Data'
            }, {
                description: 'a function providing a direct replacement',
                original: 'Original Data',
                modification: () => 'Modified Data',
                expected: 'Modified Data'
            }, {
                description: 'a function providing a modified replacement',
                original: 9322,
                modification: (number) => number + 1,
                expected: 9323
            }, {
                description: 'a direct replacement of another type',
                original: 'a string',
                modification: true,
                expected: true
            }, {
                description: 'unchanged original',
                original: 'Original data',
                modification: undefined,
                expected: 'Original data'
            }, {
                description: 'nulling a value',
                original: 'Original data',
                modification: null,
                expected: null
            }, {
                description: 'setting to an empty string',
                original: 'Non-empty string',
                modification: '',
                expected: ''
            }, {
                description: 'settings a number to 0',
                original: 1223532,
                modification: 0,
                expected: 0
            }
        ]
            .forEach(({ description, original, modification, expected }) => {
                it(`should allow ${description}`, () => {
                    const originalContents = {
                        toModify: original
                    };
                    const modifications = {
                        toModify: modification
                    };

                    assert.deepStrictEqual(
                        versionLock._performModifications(originalContents, modifications),
                        { toModify: expected }
                    );
                });
            });
    });
});
