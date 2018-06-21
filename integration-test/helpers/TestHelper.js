'use strict';

const fs = require('fs');
const nconf = require('nconf');
const _ = require('lodash');

const OSBase = require('../../src/OSBase');

const padding = 6;
const paddingCh = '0';

function IsValidId(id) {
    return OSBase.IsValidId(id);
}

function MakeStoreDirectory(storeId) {
    const storeManagerConfig = _.get(nconf.get('storeManager'), 'config', {});

    return storeManagerConfig.basePath + new OSBase().uuidToPath(
        storeId,
        storeManagerConfig.storeHierarchy,
        storeManagerConfig.pathSeparator
    ) + storeId + storeManagerConfig.pathSeparator;
}

function StoreDirectoryExists(storeId) {
    return fs.existsSync(MakeStoreDirectory(storeId));
}

function MakeObjectDirectory(storeId, objectId) {
    const storeManagerConfig = _.get(nconf.get('storeManager'), 'config', {});

    return MakeStoreDirectory(storeId) +
        new OSBase().uuidToPath(
            objectId,
            storeManagerConfig.objectHierarchy,
            storeManagerConfig.pathSeparator
        ) +
        objectId +
        storeManagerConfig.pathSeparator;
}

function MakeObjectMetadataPath(storeId, objectId, version) {
    return MakeObjectDirectory(storeId, objectId) + `metadata.v${version.toString().padLeft(padding, paddingCh)}.json`;
}

function MakeObjectContentPath(storeId, objectId, version) {
    return MakeObjectDirectory(storeId, objectId) + `content.v${version.toString().padLeft(padding, paddingCh)}.bin`;
}

function ObjectDirectoryExists(storeId, objectId) {
    return fs.existsSync(MakeObjectDirectory(storeId, objectId));
}

function ObjectExists(objectDetails, { expectedVersion, expectedContents, expectedMetadata }) {
    if (!IsValidId(objectDetails.objectId)) {
        return `objectDetails.objectId "${objectDetails.objectId}"is not a valid id`;
    }

    if (expectedVersion && objectDetails.latestVersion !== expectedVersion) {
        return `objectDetails.latestVersion was ${objectDetails.latestVersion} not ${expectedVersion}`;
    }

    if (!ObjectDirectoryExists(objectDetails.storeId, objectDetails.objectId)) {
        return `Directory ${MakeObjectDirectory(objectDetails.storeId, objectDetails.objectId)} does not exist`;
    }

    if (expectedContents) {
        const contentPath = MakeObjectContentPath(
            objectDetails.storeId,
            objectDetails.objectId,
            objectDetails.latestVersion
        );
        const content = fs.readFileSync(contentPath);

        if (!_.isEqual(content, expectedContents)) {
            return 'Content is not as expected';
        }
    }

    if (expectedMetadata) {
        const metadataPath = MakeObjectMetadataPath(
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
    IsValidId,
    MakeStoreDirectory,
    StoreDirectoryExists,
    MakeObjectDirectory,
    MakeObjectMetadataPath,
    MakeObjectContentPath,
    ObjectDirectoryExists,
    ObjectExists
};
