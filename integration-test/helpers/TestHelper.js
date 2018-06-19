'use strict';

const OSBase = require('../../src/OSBase');

function isValidId(id) {
    return OSBase.IsValidId(id);
}

module.exports = {
    isValidId
};
