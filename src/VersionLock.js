'use strict';

const consola = require('consola');
const _ = require('lodash');

const AsyncOps = require('./helpers/AsyncOps');

const logger = consola.withScope('VersionLock');

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
        let fileHandle = await AsyncOps.OpenFile(this.lockFilePath, 'wx+');
        if (!fileHandle) {
            do {
                await AsyncOps.WaitForTimeout(this.options.retryInterval);

                const elapsedTime = Date.now() - startTime;
                if (elapsedTime > this.options.waitTimeout) {
                    throw new Error(`Attempt to acquire lock on "${this.lockFilePath}" timed out (> ${this.options.waitTimeout}ms)`);
                }

                fileHandle = await AsyncOps.OpenFile(this.lockFilePath, 'wx+');
            }
            while (!fileHandle);
        }

        return fileHandle;
    }

    _bumpLatestVersion(results) {
        const bumpedResults = Object.assign({}, results);
        bumpedResults.latestVersion++;
        return bumpedResults;
    }

    async _readLockFile(fileHandle) {
        async function getLockFileSize() {
            return await AsyncOps.Stat(this.lockFilePath);
        }

        const fileSize = await getLockFileSize();
        const buffer = new Buffer(fileSize);

        const readResult = await AsyncOps.ReadFile(
            fileHandle,
            buffer,
            0,
            fileSize,
            null);

        if (readResult.bytesRead !== fileSize) {
            throw new Error(`Lock file "${this.lockFilePath}" is not of its reported size ${fileSize}`);
        }

        return JSON.parse(buffer);
    }

    async _writeLockFile(fileHandle, contents) {
        const buffer = new Buffer(JSON.stringify(contents), 'utf8');

        const writeResult = await AsyncOps.WriteFile(fileHandle, buffer);
        if (writeResult.bytesWritten !== buffer.length) {
            throw new Error(`Lock file "${this.lockFilePath}" was not of expected size ${buffer.length}`);
        }
    }

    async getContents() {
        let fileHandle;
        let contents;
        const startTime = Date.now();

        try {
            fileHandle = await this._tryToOpenLockFile(startTime);
            contents = await this._readLockFile(fileHandle);
            await this._writeLockFile(fileHandle, this._bumpLatestVersion(contents));
        } catch (error) {
            logger.error(`Failed to acquire version lock on "${this.lockFilePath}" because: ${error.message}`);
            contents = undefined;
        }

        // No need to wait.
        if (fileHandle) {
            AsyncOps.CloseFile(fileHandle);
        }

        return contents;
    }
}

module.exports = VersionLock;
