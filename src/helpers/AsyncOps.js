'use strict';

const { promisify } = require('util');

const fs = require('fs');
const consola = require('consola');
const logger = consola.withScope('AsyncOps');

const _fsOpen = promisify(fs.open);
const _fsClose = promisify(fs.close);
const _fsUnlink = promisify(fs.unlink);
const _fsRead = promisify(fs.read);
const _fsWrite = promisify(fs.write);
const _fsWriteFile = promisify(fs.writeFile);
const _fsFstat = promisify(fs.fstat);
const _mkdirp = promisify(require('mkdirp'));
const _fsExists = promisify(fs.exists);

const AsyncOps = {
    OpenFile: async (filename, mode) => {
        return _fsOpen(filename, mode);
    },
    SafeOpenFile: async (filename, mode) => {
        try {
            return await AsyncOps.OpenFile(filename, mode);
        } catch (error) {
            return null;
        }
    },
    CloseFile: async (fd) => {
        return await _fsClose(fd);
    },
    DeleteFile: async (path) => {
        return await _fsUnlink(path);
    },
    ReadFile: async (fd, buffer, offset, length, position) => {
        return await _fsRead(fd, buffer, offset, length, position);
    },
    WriteFile: async (fd, buffer, offset, length, position) => {
        return await _fsWrite(fd, buffer, offset, length, position);
    },
    WriteWholeFile: async (path, data, options) => {
        return await _fsWriteFile(path, data, options);
    },
    Stat: async (fd) => {
        return await _fsFstat(fd);
    },
    GetFileSize: async (fd) => {
        return (await AsyncOps.Stat(fd)).size;
    },
    CreateDirectory: async (path) => {
        try {
            await _mkdirp(path);
            return true;
        } catch (error) {
            logger.fatal(`Failed to create directory "${path}" because of ${error}`);
            return false;
        }
    },
    DirectoryExists: async (path) => {
        try {
            await _fsExists(path);
            return true;
        } catch (error) {
            return false;
        }
    },
    WaitForTimeout: async (timeInMs) => {
        return await new Promise(async (resolve, reject) => {
            try {
                setTimeout(resolve, timeInMs);
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = AsyncOps;
