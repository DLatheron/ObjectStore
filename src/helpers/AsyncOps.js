'use strict';

const { promisify } = require('util');

const fs = require('fs');

const OpenFile = promisify(fs.open);
const CloseFile = promisify(fs.close);
const DeleteFile = promisify(fs.unlink);
const ReadFile = promisify(fs.read);
const WriteFile = promisify(fs.write);
const Stat = promisify(fs.stat);
const WaitForTimeout = promisify(setTimeout);

module.exports = {
    OpenFile,
    SafeOpenFile: async () => {
        try {
            return await OpenFile(...arguments);
        } catch (error) {
            return null;
        }
    },
    CloseFile,
    DeleteFile,
    ReadFile,
    WriteFile,
    Stat,
    GetFileSize: async() => {
        return await Stat(...arguments).size;
    },
    WaitForTimeout
};
