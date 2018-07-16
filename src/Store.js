'use strict';

const _ = require('lodash');

const AsyncOps = require('./helpers/AsyncOps');
const OSObjectHelper = require('./helpers/OSObjectHelper');
const OSObject = require('./OSObject');
const { Reasons, OSError } = require('./OSError');

const DEFAULT_OPTIONS = {
    objectHierarchy: [3, 3],
    pathSeparator: '/',
};

class Store {
    constructor(storeId, basePath, options) {
        this.storeId = storeId;
        this.basePath = basePath;
        this.options = _.merge({}, DEFAULT_OPTIONS, options);
    }

    buildObjectPath(objectId) {
        return OSObjectHelper.IdToPath(objectId, this.options.objectHierarchy, this.options.pathSeparator) +
            objectId +
            this.options.pathSeparator;
    }

    async createStoreObject() {
        return this._createObject(this.storeId);
    }

    async createObject() {
        return this._createObject(OSObjectHelper.GenerateId());
    }

    async _createObject(objectId) {
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (!await AsyncOps.CreateDirectory(fullPath)) {
            throw new OSError(Reasons.DirectoryFailure, {
                storeId: this.storeId,
                objectId: this.objectId
            });
        }

        const osObject = new OSObject(this.storeId, objectId, fullPath);

        await osObject.createObject();

        return osObject;
    }

    async getObject(objectId) {
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (await AsyncOps.DirectoryExists(fullPath)) {
            return new OSObject(this.storeId, objectId, fullPath);
        }
    }

    // TODO: What functions do we need:
    // - Delete an object?
    // - List all objects?
    // - Does an object exist?
    // - Add user;
    // - Add group;
    // - Etc.
}

module.exports = Store;
