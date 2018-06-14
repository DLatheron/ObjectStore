'use strict';

const _ = require('lodash');

const OSBase = require('./OSBase');
const OSObject = require('./OSObject');

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

    createObject() {
        const objectId = this.generateId();
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (this.createDirectory(fullPath)) {
            return new OSObject(objectId, fullPath);
        }
    }

    getObject(objectId) {
        const fullPath = this.basePath + this.buildObjectPath(objectId);

        if (this.directoryExists(fullPath)) {
            return new OSObject(objectId, fullPath);
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
