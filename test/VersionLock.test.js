/* globals console, describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
// const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#VersionLock', () => {
    let sandbox;
    let now;
    let clock;
    let VersionLock;
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

        describe('#getContents', () => {
            let versionLock;

            beforeEach(() => {
                versionLock = new VersionLock();
            });

            it('should attempt to open the lock file', async () => {
                sandbox.mock(versionLock)
                    .expects('_tryToOpenLockFile')
                    .withExactArgs(now.getTime())
                    .once();
                sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 0 });
                sandbox.stub(versionLock, '_writeLockFile');
                sandbox.stub(AsyncOps, 'CloseFile');

                await versionLock.getContents();
            });

            it('should return the contents of the lock file if it was successfully opened, read, updated and written', async () => {
                const content = {
                    latestVersion: 17,
                    otherKey: 'Here'
                };

                sandbox.mock(versionLock)
                    .expects('_tryToOpenLockFile')
                    .withExactArgs(now.getTime())
                    .once();
                sandbox.stub(versionLock, '_readLockFile').returns(content);
                sandbox.stub(versionLock, '_writeLockFile');
                sandbox.stub(AsyncOps, 'CloseFile');

                assert.strictEqual(await versionLock.getContents(), content);

                sandbox.verify();
            });

            it('should return undefined if the lock file cannot be opened', async () => {
                sandbox.stub(versionLock, '_tryToOpenLockFile').callsFake(() => {
                    throw new Error('_tryToOpenLockFile threw this');
                });
                sandbox.mock(versionLock).expects('_readLockFile').never();
                sandbox.mock(versionLock).expects('_writeLockFile').never();
                sandbox.mock(AsyncOps).expects('CloseFile').never();

                assert.strictEqual(await versionLock.getContents(), undefined);

                sandbox.verify();
            });

            it('should attempt to read the lock file', async () => {
                sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
                sandbox.mock(versionLock)
                    .expects('_readLockFile')
                    .withExactArgs(fakeFileHandle)
                    .once()
                    .returns({ latestVersion: 17 });
                sandbox.stub(versionLock, '_writeLockFile');
                sandbox.stub(AsyncOps, 'CloseFile');

                await versionLock.getContents();

                sandbox.verify();
            });

            it('should return undefined if the lock file cannot be read', async () => {
                sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
                sandbox.stub(versionLock, '_readLockFile').callsFake(() => {
                    throw new Error('_readLockFile threw this');
                });
                sandbox.mock(versionLock).expects('_writeLockFile').never();
                sandbox.stub(AsyncOps, 'CloseFile');

                assert.strictEqual(await versionLock.getContents(), undefined);

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

                await versionLock.getContents();

                sandbox.verify();
            });

            it('should increase the latest version of the file read', async () => {
                sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
                sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 3456 });
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

            it('should return undefined if the lock file cannot be written', async () => {
                sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
                sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 1 });
                sandbox.stub(versionLock, '_writeLockFile').callsFake(() => {
                    throw new Error('_writeLockFile threw this');
                });
                sandbox.stub(AsyncOps, 'CloseFile');

                assert.strictEqual(await versionLock.getContents(), undefined);
            });

            it('should attempt to close the file if the lock file could not be written', async () => {
                sandbox.stub(versionLock, '_tryToOpenLockFile').returns(fakeFileHandle);
                sandbox.stub(versionLock, '_readLockFile').returns({ latestVersion: 1 });
                sandbox.stub(versionLock, '_writeLockFile').callsFake(() => {
                    throw new Error('_writeLockFile threw this');
                });
                sandbox.mock(AsyncOps)
                    .expects('CloseFile')
                    .withExactArgs(fakeFileHandle)
                    .once();

                assert.strictEqual(await versionLock.getContents(), undefined);

                sandbox.verify();
            });
        });
    });
});
