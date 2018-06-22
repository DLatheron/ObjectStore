/* globals console, describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const proxyquire = require('proxyquire');
const sinon = require('sinon');

const AsyncOps = require('../src/helpers/AsyncOps');
const UnitTestHelper = require('./helpers/UnitTestHelper');

describe('#Lock', () => {
    let sandbox;
    let clock;
    let Lock;
    let fakeOpenFileHandle;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers();

        Lock =  proxyquire('../src/Lock', {
            './helpers/AsyncOps': AsyncOps
        });

        fakeOpenFileHandle = 0xdeadbeef;
    });

    afterEach(() => {
        sandbox.verify();
        clock.restore();
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should generate the name of the lock file', () => {
            const lock = new Lock('./subdir/path/');

            assert.strictEqual(lock.lockFilePath, './subdir/path/.lockFile');
        });

        it('should generate the name of the lock file if overridden', () => {
            const lock = new Lock('./subdir/path/', {
                lockFilename: '.newLockFile'
            });

            assert.strictEqual(lock.lockFilePath, './subdir/path/.newLockFile');
        });

        context('options', () => {
            [
                { optionName: 'retryInterval', defaultValue: 100, overriddenValue: 200 },
                { optionName: 'waitTimeout', defaultValue: 1000, overriddenValue: 5000 },
                { optionName: 'staleTimeout', defaultValue: 10 * 60 * 60 * 1000, overriddenValue: 5 * 60 * 60 },
                { optionName: 'reentrant', defaultValue: false, overriddenValue: true },
                { optionName: 'lockFilename', defaultValue: '.lockFile', overriddenValue: '.newLockFile' }
            ]
                .forEach(({ optionName, defaultValue, overriddenValue}) => {
                    it(`should default '${optionName}' = ${defaultValue} as type ${typeof defaultValue}`, () =>{
                        const lock = new Lock();

                        assert.strictEqual(lock.options[optionName], defaultValue);
                    });

                    it('should merge the options', () => {
                        it(`should all '${optionName}' to be overridden to ${overriddenValue}`, () => {
                            const lock = new Lock('.', {
                                [optionName]: overriddenValue
                            });

                            assert.strictEqual(lock.options[optionName], overriddenValue);
                        });
                    });
                });
        });

        it('should start with a closed file', () => {
            const lock = new Lock();

            assert.strictEqual(lock.fileHandle, null);
        });
    });

    describe('#Acquire', () => {
        context('single lock', () => {
            it('should throw an Error if the passed instance is not a Lock', () => {
                try {
                    Lock.Acquire({});
                    assert.fail();
                } catch (error) {
                    assert.deepStrictEqual(error, new Error('Not a lock'));
                }
            });

            it('should attempt to acquire the lock', async () => {
                const lock = new Lock('./single/');

                sandbox.mock(AsyncOps)
                    .expects('OpenFile')
                    .withExactArgs(lock.lockFilePath, 'wx+')
                    .once()
                    .returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));

                assert.strictEqual(await Lock.Acquire(lock), true);

                sandbox.verify();
            });

            it('should backoff if the first attempt fails', async () => {
                const retryInterval = 123456;

                const lock = new Lock('./backoff/', { retryInterval });

                sandbox.stub(AsyncOps, 'OpenFile')
                    .onCall(0).returns(UnitTestHelper.createPromise().reject())
                    .onCall(1).returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
                sandbox.mock(AsyncOps)
                    .expects('WaitForTimeout')
                    .withExactArgs(retryInterval)
                    .once()
                    .returns(UnitTestHelper.createPromise().fulfill());

                assert.strictEqual(await Lock.Acquire(lock), true);

                sandbox.verify();
            });

            it('should be possible to acquire a re-entrant lock twice', async () => {
                const lock = new Lock('./reentrant/', { reentrant: true });
                lock.fileHandle = fakeOpenFileHandle;

                assert.strictEqual(await Lock.Acquire(lock), true);

                sandbox.verify();
            });

            it('should not be possible to acquire a non-re-entrant lock twice', async () => {
                const lock = new Lock('./nonreentrant/', { reentrant: false });
                lock.fileHandle = fakeOpenFileHandle;

                assert.strictEqual(await Lock.Acquire(lock), false);

                sandbox.verify();
            });

            it('should repeatedly attempt to acquire the lock', async () => {
                const retryInterval = 250;
                const waitTimeout = 1000;
                const expectedLockCount = 1 + (waitTimeout / retryInterval);
                let attemptedLockCount = 0;

                const lock = new Lock('./repeat/', { retryInterval, waitTimeout });

                sandbox.stub(AsyncOps, 'OpenFile').returns(UnitTestHelper.createPromise().reject());
                sandbox.stub(AsyncOps, 'WaitForTimeout')
                    .callsFake(() => {
                        clock.tick(250);
                        attemptedLockCount++;
                        return UnitTestHelper.createPromise().fulfill();
                    });

                assert.strictEqual(await Lock.Acquire(lock), false);

                assert.strictEqual(attemptedLockCount, expectedLockCount);
            });
        });

        context('multiple locks', () => {
            let locks;

            beforeEach(() => {
                locks = [
                    new Lock('./multiple_1/'),
                    new Lock('./multiple_2/'),
                    new Lock('./multiple_3/')
                ];
            });

            it('should throw an Error if the any of the passed instances are not a Lock', () => {
                try {
                    Lock.Acquire([
                        new Lock(),
                        {},
                        new Lock()
                    ]);
                    assert.fail();
                } catch (error) {
                    assert.deepStrictEqual(error, new Error('Not a lock'));
                }
            });

            it('should attempt to acquire the each locks', async () => {
                let expectedIndex = 0;

                sandbox.stub(AsyncOps, 'OpenFile')
                    .onCall(0).callsFake((filePath, fileMode) => {
                        assert.strictEqual(filePath, locks[0].lockFilePath);
                        assert.strictEqual(fileMode, 'wx+');
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    })
                    .onCall(1).callsFake((filePath, fileMode) => {
                        assert.strictEqual(filePath, locks[1].lockFilePath);
                        assert.strictEqual(fileMode, 'wx+');
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    })
                    .onCall(2).callsFake((filePath, fileMode) => {
                        assert.strictEqual(filePath, locks[2].lockFilePath);
                        assert.strictEqual(fileMode, 'wx+');
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    });

                assert.strictEqual(await Lock.Acquire(locks), true);

                assert.strictEqual(expectedIndex, locks.length);
            });

            it('should attempt to acquire the locks in order', async () => {
                let expectedIndex = 0;

                sandbox.stub(AsyncOps, 'OpenFile')
                    .onCall(0).callsFake(() => {
                        assert.strictEqual(0, expectedIndex);
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    })
                    .onCall(1).callsFake(() => {
                        assert.strictEqual(1, expectedIndex);
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    })
                    .onCall(2).callsFake(() => {
                        assert.strictEqual(2, expectedIndex);
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    });

                assert.strictEqual(await Lock.Acquire(locks), true);

                assert.strictEqual(expectedIndex, locks.length);
            });

            it('should fail the locking if any given lock cannot be acquire', async () => {
                sandbox.stub(AsyncOps, 'OpenFile')
                    .onCall(0).returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle))
                    .onCall(1).returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle))
                    .onCall(2).returns(UnitTestHelper.createPromise().reject());
                sandbox.stub(AsyncOps, 'WaitForTimeout').callsFake(() => {
                    clock.tick(1001);
                    return UnitTestHelper.createPromise().fulfill();
                });

                assert.strictEqual(await Lock.Acquire(locks), false);
            });
        });
    });

    describe('#Release', () => {
        context('single lock', () => {
            let lock;

            beforeEach(() => {
                lock = new Lock('./releaseTest/');
                sandbox.stub(AsyncOps, 'OpenFile').returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
            });

            it('should throw an Error if the passed instance is not a Lock', async () => {
                try {
                    await Lock.Release({});
                    assert.fail();
                } catch (error) {
                    assert.deepStrictEqual(error, new Error('Not a lock'));
                }
            });

            it('should catch any error thrown by unlocking (deletion)', async () => {
                lock.fileHandle = fakeOpenFileHandle;
                sandbox.stub(AsyncOps, 'DeleteFile').returns(UnitTestHelper.createPromise().reject());

                await Lock.Release(lock);

                assert.strictEqual(lock.fileHandle, null);
            });

            it('should catch any error thrown by unlocking (closing)', async () => {
                lock.fileHandle = fakeOpenFileHandle;
                sandbox.stub(AsyncOps, 'DeleteFile').returns(UnitTestHelper.createPromise().fulfill());
                sandbox.stub(AsyncOps, 'CloseFile').returns(UnitTestHelper.createPromise().reject());

                await Lock.Release(lock);

                assert.strictEqual(lock.fileHandle, null);
            });

            it('should not error if the lock has not been acquired', async () => {
                await Lock.Release(lock);

                assert.strictEqual(lock.fileHandle, null);
            });

            it('should release the lock if it has been acquired', async () => {
                lock.fileHandle = fakeOpenFileHandle;
                sandbox.stub(AsyncOps, 'DeleteFile').returns(UnitTestHelper.createPromise().fulfill());
                sandbox.stub(AsyncOps, 'CloseFile').returns(UnitTestHelper.createPromise().fulfill());

                await Lock.Release(lock);

                assert.strictEqual(lock.fileHandle, null);
            });
        });

        context('multiple locks', () => {
            let locks;

            beforeEach(() => {
                locks = [
                    new Lock('./multipleReleaseTest_1/'),
                    new Lock('./multipleReleaseTest_2/'),
                    new Lock('./multipleReleaseTest_3/')
                ];

                locks.forEach(lock => lock.fileHandle = fakeOpenFileHandle);
            });

            it('should throw an Error if the any of the passed instances are not a Lock', async () => {
                try {
                    await Lock.Release([
                        new Lock(),
                        {},
                        new Lock()
                    ]);
                    assert.fail();
                } catch (error) {
                    assert.deepStrictEqual(error, new Error('Not a lock'));
                }
            });

            it('should attempt to release each lock', async () => {
                let expectedCalls = 0;

                function validateCall(lockIndex, expectedArgument, sequence, argument) {
                    assert.strictEqual(argument, expectedArgument);
                    assert.strictEqual(expectedCalls, sequence);
                    expectedCalls++;
                    return UnitTestHelper.createPromise().fulfill();
                }

                sandbox.stub(AsyncOps, 'DeleteFile')
                    .onCall(0).callsFake(validateCall.bind('DeleteFile', 0, locks[0].lockFilePath, 0))
                    .onCall(1).callsFake(validateCall.bind('DeleteFile', 1, locks[1].lockFilePath, 2))
                    .onCall(2).callsFake(validateCall.bind('DeleteFile', 2, locks[2].lockFilePath, 4));

                sandbox.stub(AsyncOps, 'CloseFile')
                    .onCall(0).callsFake(validateCall.bind('CloseFile', 0, fakeOpenFileHandle, 1))
                    .onCall(1).callsFake(validateCall.bind('CloseFile', 1, fakeOpenFileHandle, 3))
                    .onCall(2).callsFake(validateCall.bind('CloseFile', 2, fakeOpenFileHandle, 5));

                await Lock.Release(locks);

                assert.strictEqual(expectedCalls, 6);
            });

            it('should attempt to release the locks in order', async () => {
                let expectedIndex = 0;

                sandbox.stub(AsyncOps, 'DeleteFile').returns(UnitTestHelper.createPromise().fulfill());
                sandbox.stub(AsyncOps, 'CloseFile')
                    .onCall(0).callsFake(() => {
                        assert.strictEqual(0, expectedIndex);
                        expectedIndex++;
                    })
                    .onCall(1).callsFake(() => {
                        assert.strictEqual(1, expectedIndex);
                        expectedIndex++;
                    })
                    .onCall(2).callsFake(() => {
                        assert.strictEqual(2, expectedIndex);
                        expectedIndex++;
                    });

                await Lock.Release(locks);

                assert.strictEqual(expectedIndex, locks.length);
            });

            it('should not attempt to release the locks that are not acquired', async () => {
                locks[1].fileHandle = null;
                sandbox.stub(AsyncOps, 'DeleteFile').returns(UnitTestHelper.createPromise().fulfill());
                sandbox.mock(AsyncOps)
                    .expects('CloseFile')
                    .twice();

                await Lock.Release(locks);

                sandbox.verify();
            });

            it('should unlock all locks, even if a previous one fails', async () => {
                sandbox.stub(AsyncOps, 'DeleteFile').returns(UnitTestHelper.createPromise().fulfill());
                sandbox.stub(AsyncOps, 'CloseFile')
                    .onCall(0).returns(UnitTestHelper.createPromise().fulfill())
                    .onCall(1).returns(UnitTestHelper.createPromise().reject())
                    .onCall(2).returns(UnitTestHelper.createPromise().fulfill());

                await Lock.Release(locks);

                assert.strictEqual(locks[0].fileHandle, null);
                assert.strictEqual(locks[2].fileHandle, null);
            });
        });
    });
});
