'use strict';

const _ = require('lodash');

const OSBase = require('./OSBase');
const OSObject = require('./OSObject');
const OSObjectDetails = require('./ObjectDetails');

const DEFAULT_OPTIONS = {
    objectHierarchy: [3, 3],
    pathSeparator: '/',
};

class Store extends OSBase {
    constructor(storeId, basePath, options) {
        super();

        this.storeId = storeId;
        this.basePath = basePath;
        this.options = _.merge({}, DEFAULT_OPTIONS, options);
    }

    buildObjectPath(objectId) {
        return this.uuidToPath(objectId, this.options.objectHierarchy, this.options.pathSeparator) +
            objectId +
            this.options.pathSeparator;
    }

    async createObject() {
        const objectId = this.generateId();
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (await this.createDirectory(fullPath)) {
            const osObject = new OSObject(this.storeId, objectId, fullPath);

            osObject.details = new OSObjectDetails();
            if (await osObject._writeDetails()) {
                return osObject;
            }
        }
    }

    async getObject(objectId) {
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (await this.directoryExists(fullPath)) {
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
