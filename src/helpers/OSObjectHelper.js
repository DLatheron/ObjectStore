'use strict';

'use strict';

const { promisify } = require('util');

const consola = require('consola');

const exists = promisify(require('fs').exists);
const mkdirp = promisify(require('mkdirp'));
const uuid = require('uuid/v4');

const logger = consola.withScope('OSObjectHelper');

const idRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

function GenerateId() {
    return uuid();
}

function IsValidId(id) {
    return !!id.match(idRegex);
}

async function CreateDirectory(path) {
    try {
        await mkdirp(path);
        return true;
    } catch (error) {
        logger.fatal(`Failed to create directory "${path}" because of ${error}`);
        return false;
    }
}

async function DirectoryExists(path) {
    try {
        await exists(path);
        return true;
    } catch (error) {
        return false;
    }
}

function IdToPath(id, hierarchy, pathSeparator) {
    const uuidStr = id.toString();
    const uuidStrNoDashes = uuidStr.replace('-', '');
    let uuidLeft = uuidStrNoDashes;

    const keys = hierarchy.map(keyLength => {
        const key = uuidLeft.slice(0, keyLength);
        uuidLeft = uuidLeft.slice(keyLength);
        return key;
    });

    return keys.join(pathSeparator) + pathSeparator;
}

module.exports = {
    GenerateId,
    IsValidId,
    CreateDirectory,
    DirectoryExists,
    IdToPath
};
