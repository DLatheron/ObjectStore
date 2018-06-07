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

        it('should merge the options');
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

    describe('#unlock', () => {

    });
});
