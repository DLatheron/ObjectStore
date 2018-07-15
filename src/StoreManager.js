'use strict';

const consola = require('consola');
const klaw = require('klaw');
const through2 = require('through2');
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

    async listStores() {
        const storeRegex = /\/([0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})$/i;

        const onlyDirectories = through2.obj(function (item, enc, next) {
            if (item.stats.isDirectory()) this.push(item);
            next();
        });

        return await new Promise((resolve, reject) => {
            const items = [];

            klaw(this.options.basePath, {
                depthLimit: 2
            })
                .pipe(onlyDirectories)
                .on('data', item => {
                    const match = item.path.match(storeRegex);
                    if (match) {
                        items.push(match[1]);
                    }
                })
                .on('error', () => {
                    reject();
                })
                .on('end', () => {
                    resolve(items);
                });
        });
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
