'use strict';

const { promisify } = require('util');

const consola = require('consola');
const exists = promisify(require('fs').exists);
const mkdirp = promisify(require('mkdirp'));
const uuid = require('uuid/v4');

const logger = consola.withScope('OSBase');

class OSBase {
    constructor() {
    }

    generateId() {
        return uuid();
    }

    async createDirectory(path) {
        try {
            await mkdirp(path);
            return true;
        } catch (error) {
            logger.fatal(`Failed to create directory "${path}" because of ${error}`);
            return false;
        }
    }

    async directoryExists(path) {
        try {
            await exists(path);
            return true;
        } catch (error) {
            return false;
        }
    }

    uuidToPath(uuid, hierarchy, pathSeparator) {
        const uuidStr = uuid.toString();
        const uuidStrNoDashes = uuidStr.replace('-', '');
        let uuidLeft = uuidStrNoDashes;

        const keys = hierarchy.map(keyLength => {
            const key = uuidLeft.slice(0, keyLength);
            uuidLeft = uuidLeft.slice(keyLength);
            return key;
        });

        return keys.join(pathSeparator) + pathSeparator;
    }
}

module.exports = OSBase;
