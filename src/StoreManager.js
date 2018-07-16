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

    async getMetadata(storeId) {
        const store = await this.getStore(storeId);
        const osObject = await store.getObject(storeId);
        return osObject.getMetadata();
    }

    async listStores() {
        const storeRegex = /\/([0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12})$/i;

        const onlyDirectories = through2.obj(function (item, enc, next) {
            if (item.stats.isDirectory()) this.push(item);
            next();
        });

        return await new Promise(async (resolve, reject) => {
            const items = [];

            // TODO: This is not efficient - would be better to get all of these

            klaw(this.options.basePath, {
                depthLimit: 2
            })
                .pipe(onlyDirectories)
                .on('data', (item) => {
                    const match = item.path.match(storeRegex);
                    if (match) {
                        const storeId = match[1];

                        items.push(storeId);
                    }
                })
                .on('error', () => {
                    reject();
                })
                .on('end', () => {
                    resolve(items);
                });
        }).then(async (storeIds) => {
            // TODO: Await is non-optimal.
            const storeMetadata = await Promise.all(storeIds.map(async (storeId) => {
                return Object.assign(
                    {},
                    { id: storeId },
                    await this.getMetadata(storeId)
                );
            }));

            return storeMetadata;
        });
    }

    async createStore(metadata) {
        const storeId = OSObjectHelper.GenerateId();
        const storePath = this.options.basePath + this.buildStorePath(storeId);

        if (await AsyncOps.CreateDirectory(storePath)) {
            const store = new Store(storeId, storePath, this.options);
            const storeObject = await store.createStoreObject();
            const results = await storeObject.updateObject(null, metadata);

            return results;
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
