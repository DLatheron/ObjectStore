'use strict';

const { promisify } = require('util');

const consola = require('consola');
const exists = promisify(require('fs').exists);
const mkdirp = promisify(require('mkdirp'));
const uuid = require('uuid/v4');

const logger = consola.withScope('OSBase');

const idRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

class OSBase {
    constructor() {
    }

    generateId() {
        return uuid();
    }

    static IsValidId(id) {
        return !!id.match(idRegex);
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
