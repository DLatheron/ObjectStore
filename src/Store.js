'use strict';

const _ = require('lodash');

const OSObjectHelper = require('./helpers/OSObjectHelper');
const OSObject = require('./OSObject');
const OSObjectDetails = require('./ObjectDetails');

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

    async createObject() {
        const objectId = OSObjectHelper.GenerateId();
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (await OSObjectHelper.CreateDirectory(fullPath)) {
            const osObject = new OSObject(this.storeId, objectId, fullPath);

            osObject.details = new OSObjectDetails();
            if (await osObject._writeDetails()) {
                return osObject;
            }
        }
    }

    async getObject(objectId) {
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (await OSObjectHelper.DirectoryExists(fullPath)) {
            const osObject = new OSObject(this.storeId, objectId, fullPath);

            if (await osObject._readDetails()) {
                return osObject;
            }
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
