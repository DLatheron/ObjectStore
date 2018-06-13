'use strict';

const consola = require('consola');
const logger = consola.withScope('StoreManager');
const _ = require('lodash');

const OSBase = require('./OSBase');
const Store = require('./Store');

const DEFAULT_OPTIONS = {
    storeHierarchy: [3, 3],
    objectHierarchy: [3, 3],
    pathSeparator: '/',
    storeBasePath: './Stores/'
};

class StoreManager extends OSBase {
    constructor(options) {
        super();

        this.options = _.merge({}, DEFAULT_OPTIONS, options);
    }

    buildStorePath(storeId) {
        return this.uuidToPath(storeId, this.options.storeHierarchy, this.options.pathSeparator) +
            storeId +
            this.options.pathSeparator;
    }

    async createStore() {
        const storeId = this.generateId();
        const storePath = this.options.storeBasePath + this.buildStorePath(storeId);

        try {
            if (this.createDirectory(storePath)) {
                return new Store(storeId, storePath, this.options);
            }
        } catch (error) {
            logger.error(`Unable to create directory '${storePath}' because of '${error}'`);
        }
    }

    async getStore(storeId) {
        const storePath = this.options.storeBasePath + this.buildStorePath(storeId);

        if (this.directoryExists(storePath)) {
            return new Store(storeId, storePath, this.options);
        }
    }

    // async createObject(storeId) {
    //     const objectId = this.generateId();
    //     const fullPath = this.options.storeBasePath + this.buildPath(storeId, objectId);

    //     try {
    //         await this.mkdirp(fullPath);

    //         return new Object(objectId, fullPath);
    //     } catch (error) {
    //         logger.error(`Unable to create directory '${fullPath}' becaise of '${error}'`);
    //     }
    // }

    // async getOrCreateObject(storeId, objectId) {
    //     const fullPath = this.options.storeBasePath + this.buildPath(storeId, objectId);

    //     try {
    //         await this.mkdirp(fullPath);

    //         return new Object(fullPath);
    //     } catch (error) {
    //         logger.error(`Unable to create directory '${fullPath}' becaise of '${error}'`);
    //     }
    // }
}

module.exports = StoreManager;
