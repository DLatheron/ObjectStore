'use strict';

const { promisify } = require('util');

const exists = promisify(require('fs').exists);
const OSBase = require('../../src/OSBase');
const nconf = require('nconf');
const _ = require('lodash');

function isValidId(id) {
    return OSBase.IsValidId(id);
}

async function storeDirectoryExists(storeId) {
    const storeManagerConfig = _.get(nconf.get('storeManager'), 'config', {});
    const dirPath = storeManagerConfig.basePath + new OSBase().uuidToPath(
        storeId,
        storeManagerConfig.storeHierarchy,
        storeManagerConfig.pathSeparator
    ) + storeId + storeManagerConfig.pathSeparator;

    try {
        await exists(dirPath);
        return true;
    } catch (error) {
        return false;
    }
}

module.exports = {
    isValidId,
    storeDirectoryExists
};
