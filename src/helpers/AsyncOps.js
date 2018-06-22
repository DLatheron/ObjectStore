'use strict';

const { promisify } = require('util');

const fs = require('fs');

const OpenFile = promisify(fs.open);
const CloseFile = promisify(fs.close);
const DeleteFile = promisify(fs.unlink);
const WaitForTimeout = promisify(setTimeout);

module.exports = {
    OpenFile,
    CloseFile,
    DeleteFile,
    WaitForTimeout
};
