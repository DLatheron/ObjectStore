'use strict';

const consola = require('consola');
const fs = require('fs');
const logger = consola.withScope('Store');
const { promisify } = require('util');
const uuid = require('uuid/v4');
const _ = require('lodash');

const Object = require('./Object');
const Store = require('./Store');

const DEFAULT_OPTIONS = {
    storeHierarchy: [3, 3],
    objectHierarchy: [3, 3],
    pathSeparator: '/',
    storeBasePath: './Stores/'
};

class StoreManager {
    constructor(options) {
        this.options = _.merge({}, DEFAULT_OPTIONS, options);

        this.mkdir = promisify(fs.mkdir);
    }

    generateId() {
        return uuid();
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

    buildStorePath(storeId) {
        return this.uuidToPath(storeId, this.options.storeHierarchy, this.options.pathSeparator) +
            storeId +
            this.options.pathSeparator;
    }

    buildObjectPath(objectId) {
        return this.uuidToPath(objectId, this.options.objectHierarchy, this.options.pathSeparator) +
            objectId +
            this.options.pathSeparator;
    }

    buildPath(storeId, objectId) {
        return this.buildStorePath(storeId) + this.buildObjectPath(objectId);
    }

    async getOrCreateStore(storeId) {
        const storePath = this.options.storeBasePath + this.buildStorePath(storeId);

        try {
            await this.mkdir(storePath);

            return new Store(storePath);
        } catch (error) {
            logger.error(`Unable to create directory '${storePath}' because of '${error}'`);
        }
    }

    async getOrCreateObject(storeId, objectId) {
        const fullPath = this.options.storeBasePath + this.buildPath(storeId, objectId);

        try {
            await this.mkdir(fullPath);

            return new Object(fullPath);
        } catch (error) {
            logger.error(`Unable to create directory '${fullPath}' becaise of '${error}'`);
        }
    }
}

module.exports = StoreManager;
