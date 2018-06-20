'use strict';

const { promisify } = require('util');

const consola = require('consola');
const fs = require('fs-extra');
const OSBase = require('./OSBase');
const Store = require('./Store');
const _ = require('lodash');

const logger = consola.withScope('StoreManager');

const DEFAULT_OPTIONS = {
    storeHierarchy: [3, 3],
    objectHierarchy: [3, 3],
    pathSeparator: '/',
    basePath: './Stores/'
};

class StoreManager extends OSBase {
    constructor(options) {
        super();

        this.options = _.merge({}, DEFAULT_OPTIONS, options);

        this.remove = promisify(fs.remove);
    }

    buildStorePath(storeId) {
        return this.uuidToPath(storeId, this.options.storeHierarchy, this.options.pathSeparator) +
            storeId +
            this.options.pathSeparator;
    }

    async createStore() {
        const storeId = this.generateId();
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        if (await this.createDirectory(storePath)) {
            return new Store(storeId, storePath, this.options);
        }
    }

    async getStore(storeId) {
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        if (await this.directoryExists(storePath)) {
            return new Store(storeId, storePath, this.options);
        }
    }

    async deleteStore(storeId) {
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        try {
            await this.remove(storePath);
            return true;
        } catch (error) {
            logger.error(`Failed to delete store ${storeId} because of ${error}`);
            return false;
        }
    }
}

module.exports = StoreManager;
