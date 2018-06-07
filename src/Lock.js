'use strict';

const fs = require('fs');
const _ = require('lodash');
const { promisify } = require('util');

const DEFAULT_OPTIONS = {
    retryInterval: 100, // milliseconds
    waitTimeout: 1000, // milliseconds
    staleTimeout: 10 * 60 * 60 * 1000, // milliseconds,
    reentrant: false
};

function validateLock(lock) {
    if (!(lock instanceof Lock)) {
        throw new Error('Not a lock');
    }
}

function validateLocks(locks) {
    _.forEach(locks, lock => validateLock(lock));
}

async function AcquireLock(lock, startTime, options) {
    try {
        const result = await lock._tryToLock();
        if (result === 'alreadyAcquired') {
            return options.reentrant;
        }

        lock.fileHandle = result;

        if (!lock.fileHandle) {
            do {
                // TODO: Improve.
                await lock.asyncWaitForTimeout(options.retryInterval);

                const elapsedTime = Date.now() - startTime;
                if (elapsedTime > options.waitTimeout) {
                    return false;
                }

                lock.fileHandle = await lock._tryToLock();
            }
            while (!lock.fileHandle);
        }

        return true;
    } catch (error) {
        return false;
    }
}

async function AcquireSingle(lock) {
    const startTime = Date.now();

    return AcquireLock(lock, startTime, lock.options);
}

async function AcquireMultiple(locks) {
    const startTime = Date.now();

    for (let i = 0; i < locks.length; i++) {
        const lock = locks[i];

        if (!await AcquireLock(lock, startTime, lock.options)) {
            return false;
        }
    }

    return true;
}

function ReleaseLock(lock) {
    try {
        if (lock.fileHandle) {
            lock.closeFile(lock.fileHandle);
            lock.fileHandle = null;
        }
    } catch (error) {
        return;
    }
}

function ReleaseSingle(lock) {
    return ReleaseLock(lock);
}
function ReleaseMultiple(locks) {
    return locks.forEach(lock => ReleaseLock(lock));
}

class Lock {
    constructor(basePath = './', options = {}) {
        this.lockFilePath = basePath + '.lockFile';
        this.options = _.merge({}, DEFAULT_OPTIONS, options);
        this.fileHandle = null;

        this.asyncOpenFile = promisify(fs.open);
        this.asyncWaitForTimeout = promisify(setTimeout);
        this.closeFile = fs.close;
    }

    async _tryToLock() {
        try {
            if (this.fileHandle) {
                return 'alreadyAcquired';
            }

            return await this.asyncOpenFile(this.lockFilePath, 'wx+');
        } catch (error) {
            return;
        }
    }

    static Acquire(lockOrArrayOfLocks) {
        if (_.isArray(lockOrArrayOfLocks)) {
            validateLocks(lockOrArrayOfLocks);
            return AcquireMultiple(lockOrArrayOfLocks);
        } else {
            validateLock(lockOrArrayOfLocks);
            return AcquireSingle(lockOrArrayOfLocks);
        }
    }

    static Release(lockOrArrayOfLocks) {
        if (_.isArray(lockOrArrayOfLocks)) {
            validateLocks(lockOrArrayOfLocks);
            return ReleaseMultiple(lockOrArrayOfLocks);
        } else {
            validateLock(lockOrArrayOfLocks);
            return ReleaseSingle(lockOrArrayOfLocks);
        }
    }
}

module.exports = Lock;
