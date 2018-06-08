/* globals console, describe, it, context, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const Lock = require('../src/Lock');
// const proxyquire = require('proxyquire');
const sinon = require('sinon');
const UnitTestHelper = require('./helpers/UnitTestHelper');
// const _ = require('lodash');

describe('#Lock', () => {
    let sandbox;
    let clock;
    let fakeOpenFileHandle;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        clock = sinon.useFakeTimers();

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

        context('options', () => {
            [
                { optionName: 'retryInterval', defaultValue: 100, overriddenValue: 200 },
                { optionName: 'waitTimeout', defaultValue: 1000, overriddenValue: 5000 },
                { optionName: 'staleTimeout', defaultValue: 10 * 60 * 60 * 1000, overriddenValue: 5 * 60 * 60 },
                { optionName: 'reentrant', defaultValue: false, overriddenValue: true }
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

                sinon.mock(lock)
                    .expects('asyncOpenFile')
                    .withExactArgs(lock.lockFilePath, 'wx+')
                    .once()
                    .returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));

                assert.strictEqual(await Lock.Acquire(lock), true);

                sandbox.verify();
            });

            it('should backoff if the first attempt fails', async () => {
                const retryInterval = 123456;

                const lock = new Lock('./backoff/', { retryInterval });

                sinon.stub(lock, 'asyncOpenFile')
                    .onFirstCall().returns(UnitTestHelper.createPromise().reject())
                    .onSecondCall().returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
                sinon.mock(lock)
                    .expects('asyncWaitForTimeout')
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

                sinon.stub(lock, 'asyncOpenFile').returns(UnitTestHelper.createPromise().reject());
                sinon.stub(lock, 'asyncWaitForTimeout')
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
                locks.forEach((lock, index) => {
                    sinon.mock(locks[index])
                        .expects('asyncOpenFile')
                        .withExactArgs(lock.lockFilePath, 'wx+')
                        .once()
                        .returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
                });

                assert.strictEqual(await Lock.Acquire(locks), true);

                sandbox.verify();
            });

            it('should attempt to acquire the locks in order', async () => {
                let expectedIndex = 0;

                locks.forEach((lock, index) => {
                    sinon.stub(locks[index], 'asyncOpenFile').callsFake(() => {
                        assert.strictEqual(index, expectedIndex);
                        expectedIndex++;
                        return UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle);
                    });
                });

                assert.strictEqual(await Lock.Acquire(locks), true);

                assert.strictEqual(expectedIndex, locks.length);
            });

            it('should fail the locking if any given lock cannot be acquire', async () => {
                sinon.stub(locks[0], 'asyncOpenFile').returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
                sinon.stub(locks[1], 'asyncOpenFile').returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
                sinon.stub(locks[2], 'asyncOpenFile').returns(UnitTestHelper.createPromise().reject());
                sinon.stub(locks[2], 'asyncWaitForTimeout').callsFake(() => {
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
                sinon.stub(lock, 'asyncOpenFile').returns(UnitTestHelper.createPromise().fulfill(fakeOpenFileHandle));
            });

            it('should throw an Error if the passed instance is not a Lock', async () => {
                try {
                    await Lock.Release({});
                    assert.fail();
                } catch (error) {
                    assert.deepStrictEqual(error, new Error('Not a lock'));
                }
            });

            it('should catch any error thrown by unlocking', async () => {
                lock.fileHandle = fakeOpenFileHandle;
                sinon.stub(lock, 'closeFile').returns(UnitTestHelper.createPromise().reject());

                await Lock.Release(lock);

                assert.strictEqual(lock.fileHandle, null);
            });

            it('should not error if the lock has not been acquired', async () => {
                await Lock.Release(lock);

                assert.strictEqual(lock.fileHandle, null);
            });

            it('should release the lock if it has been acquired', async () => {
                lock.fileHandle = fakeOpenFileHandle;
                sinon.stub(lock, 'closeFile').returns(UnitTestHelper.createPromise().fulfill());

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

            it('should attempt to release the each locks', async () => {
                locks.forEach((lock, index) => {
                    sinon.mock(locks[index])
                        .expects('closeFile')
                        .withExactArgs(fakeOpenFileHandle)
                        .once();
                });

                await Lock.Release(locks);

                sandbox.verify();
            });

            it('should attempt to release the locks in order', async () => {
                let expectedIndex = 0;

                locks.forEach((lock, index) => {
                    sinon.stub(locks[index], 'closeFile').callsFake(() => {
                        assert.strictEqual(index, expectedIndex);
                        expectedIndex++;
                    });
                });

                await Lock.Release(locks);

                assert.strictEqual(expectedIndex, locks.length);
            });

            it('should not attempt to release the locks that are not acquired', async () => {
                locks[1].fileHandle = null;
                sinon.stub(locks[0], 'closeFile');
                sinon.mock(locks[1])
                    .expects('closeFile')
                    .never();
                sinon.stub(locks[2], 'closeFile');

                await Lock.Release(locks);

                sandbox.verify();
            });

            it('should unlock all locks, even if a previous one fails', async () => {
                sinon.stub(locks[0], 'asyncOpenFile').returns(UnitTestHelper.createPromise().fulfill());
                sinon.stub(locks[1], 'asyncOpenFile').returns(UnitTestHelper.createPromise().reject());
                sinon.mock(locks[2])
                    .expects('asyncOpenFile')
                    .once()
                    .returns(UnitTestHelper.createPromise().fulfill());

                await Lock.Release(locks);

                sandbox.verify();
            });
        });
    });
});
