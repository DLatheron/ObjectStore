'use strict';

const consola = require('consola');
const _ = require('lodash');

const AsyncOps = require('./helpers/AsyncOps');
const OSObjectHelper = require('./helpers/OSObjectHelper');
const Store = require('./Store');

const logger = consola.withScope('StoreManager');

const DEFAULT_OPTIONS = {
    storeHierarchy: [3, 3],
    objectHierarchy: [3, 3],
    pathSeparator: '/',
    basePath: './Stores/'
};

class StoreManager {
    constructor(options) {
        this.options = _.merge({}, DEFAULT_OPTIONS, options);
    }

    buildStorePath(storeId) {
        return OSObjectHelper.IdToPath(storeId, this.options.storeHierarchy, this.options.pathSeparator) +
            storeId +
            this.options.pathSeparator;
    }

    async createStore() {
        const storeId = OSObjectHelper.GenerateId();
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        if (await AsyncOps.CreateDirectory(storePath)) {
            return new Store(storeId, storePath, this.options);
        }
    }

    async getStore(storeId) {
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        if (await AsyncOps.DirectoryExists(storePath)) {
            return new Store(storeId, storePath, this.options);
        }
    }

    async deleteStore(storeId) {
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        try {
            await AsyncOps.DeleteFile(storePath);
            return true;
        } catch (error) {
            logger.error(`Failed to delete store ${storeId} because of ${error}`);
            return false;
        }
    }
}

module.exports = StoreManager;
