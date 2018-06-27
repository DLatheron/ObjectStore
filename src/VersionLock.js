'use strict';

const _ = require('lodash');

const AsyncOps = require('./helpers/AsyncOps');
const { Reasons, OSError } = require('./OSError');

const DEFAULT_OPTIONS = {
    retryInterval: 100, // milliseconds
    waitTimeout: 1000, // milliseconds
    lockFilename: '.lockFile'
};

class VersionLock {
    constructor(basePath = './', options = {}) {
        this.options = _.merge({}, DEFAULT_OPTIONS, options);
        this.lockFilePath = basePath + this.options.lockFilename;
    }

    async _tryToOpenLockFile(startTime) {
        let fileHandle = await AsyncOps.SafeOpenFile(this.lockFilePath, 'wx+');
        if (!fileHandle) {
            do {
                await AsyncOps.WaitForTimeout(this.options.retryInterval);

                const elapsedTime = Date.now() - startTime;
                if (elapsedTime > this.options.waitTimeout) {
                    throw new Error(`Attempt to acquire lock on "${this.lockFilePath}" timed out (> ${this.options.waitTimeout}ms)`);
                }

                fileHandle = await AsyncOps.SafeOpenFile(this.lockFilePath, 'wx+');
            }
            while (!fileHandle);
        }

        return fileHandle;
    }

    async _readLockFile(fileHandle) {
        const fileSize = await AsyncOps.GetFileSize(this.lockFilePath);
        const buffer = new Buffer(fileSize);

        const readResult = await AsyncOps.ReadFile(
            fileHandle,
            buffer,
            0,
            fileSize,
            null);

        if (readResult.bytesRead !== fileSize) {
            throw new Error(`Lock file "${this.lockFilePath}" was ${readResult.bytesRead} bytes when it was expected to be ${fileSize} bytes`);
        }

        return JSON.parse(buffer.toString());
    }

    async _writeLockFile(fileHandle, contents) {
        const buffer = new Buffer(JSON.stringify(contents), 'utf8');

        const writeResult = await AsyncOps.WriteFile(fileHandle, buffer);
        if (writeResult.bytesWritten !== buffer.length) {
            throw new Error(`Lock file "${this.lockFilePath}" was ${writeResult.bytesWritten} bytes not the expected size ${buffer.length} bytes`);
        }
    }

    _performModifications(originalContents, modifications) {
        if (!modifications) {
            return originalContents;
        }

        let updatedContents = {};

        _.mapKeys(originalContents, (value, propertyName) => {
            if (modifications[propertyName] === undefined) {
                updatedContents[propertyName] = originalContents[propertyName];
            } else if (typeof modifications[propertyName] === 'function') {
                updatedContents[propertyName] =
                    modifications[propertyName](originalContents[propertyName], modifications);
            } else {
                updatedContents[propertyName] = modifications[propertyName];
            }
        });

        return updatedContents;
    }

    async getContents(modifications) {
        let fileHandle;
        let contents;
        const startTime = Date.now();

        try {
            fileHandle = await this._tryToOpenLockFile(startTime);
        } catch (error) {
            throw new OSError(Reasons.LockCouldNotBeAcquired);
        }

        try {
            contents = await this._readLockFile(fileHandle);
        } catch (error) {
            // No need to wait for close to complete.
            if (fileHandle) { AsyncOps.CloseFile(fileHandle); }
            throw new OSError(Reasons.LockFileIsCorrupt);
        }

        const updatedContents = this._performModifications(contents, modifications);

        try {
            await this._writeLockFile(fileHandle, updatedContents);
        } catch (error) {
            // No need to wait for close to complete.
            if (fileHandle) { AsyncOps.CloseFile(fileHandle); }
            throw new OSError(Reasons.LockCouldNotBeWritten);
        }

        return contents;
    }
}

module.exports = VersionLock;
