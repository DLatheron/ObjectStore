'use strict';

const fs = require('fs');
const nconf = require('nconf');
const _ = require('lodash');

const OSBase = require('../../src/OSBase');

const padding = 6;
const paddingCh = '0';

function isValidId(id) {
    return OSBase.IsValidId(id);
}

function makeStoreDirectory(storeId) {
    const storeManagerConfig = _.get(nconf.get('storeManager'), 'config', {});

    return storeManagerConfig.basePath + new OSBase().uuidToPath(
        storeId,
        storeManagerConfig.storeHierarchy,
        storeManagerConfig.pathSeparator
    ) + storeId + storeManagerConfig.pathSeparator;
}

function storeDirectoryExists(storeId) {
    return fs.existsSync(makeStoreDirectory(storeId));
}

function makeObjectDirectory(storeId, objectId) {
    const storeManagerConfig = _.get(nconf.get('storeManager'), 'config', {});

    return makeStoreDirectory(storeId) +
        new OSBase().uuidToPath(
            objectId,
            storeManagerConfig.objectHierarchy,
            storeManagerConfig.pathSeparator
        ) +
        objectId +
        storeManagerConfig.pathSeparator;
}

function makeObjectMetadataPath(storeId, objectId, version) {
    return makeObjectDirectory(storeId, objectId) + `metadata.v${version.toString().padLeft(padding, paddingCh)}.json`;
}

function makeObjectContentPath(storeId, objectId, version) {
    return makeObjectDirectory(storeId, objectId) + `content.v${version.toString().padLeft(padding, paddingCh)}.bin`;
}

function objectDirectoryExists(storeId, objectId) {
    return fs.existsSync(makeObjectDirectory(storeId, objectId));
}

function objectExists(objectDetails, { expectedVersion, expectedContent, expectedMetadata }) {
    if (!isValidId(objectDetails.objectId)) {
        return `objectDetails.objectId "${objectDetails.objectId}"is not a valid id`;
    }

    if (expectedVersion && objectDetails.latestVersion !== expectedVersion) {
        return `objectDetails.latestVersion was ${objectDetails.latestVersion} not ${expectedVersion}`;
    }

    if (!objectDirectoryExists(objectDetails.storeId, objectDetails.objectId)) {
        return `Directory ${makeObjectDirectory(objectDetails.storeId, objectDetails.objectId)} does not exist`;
    }

    if (expectedContent) {
        const contentPath = makeObjectContentPath(
            objectDetails.storeId,
            objectDetails.objectId,
            objectDetails.latestVersion
        );
        const content = fs.readFileSync(contentPath);

        if (!_.isEqual(content, expectedContent)) {
            return 'Content is not as expected';
        }
    }

    if (expectedMetadata) {
        const metadataPath = makeObjectMetadataPath(
            objectDetails.storeId,
            objectDetails.objectId,
            objectDetails.latestVersion
        );
        const metadata = JSON.parse(fs.readFileSync(metadataPath, { encoding: 'utf8' }));

        if (!_.isEqual(metadata, expectedMetadata)) {
            return 'Metadata is not as expected';
        }
    }
}

module.exports = {
    isValidId,
    makeStoreDirectory,
    storeDirectoryExists,
    makeObjectDirectory,
    makeObjectMetadataPath,
    makeObjectContentPath,
    objectDirectoryExists,
    objectExists
};
