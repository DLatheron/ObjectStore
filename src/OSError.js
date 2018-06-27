'use strict';

const _ = require('lodash');

const { Reasons, Categories } = require('./OSErrors.json');

_.forIn(
    Reasons,
    reasonAndCategory =>
        reasonAndCategory.category = Categories[reasonAndCategory.category]
);

class OSError {
    constructor(reason, message) {
        this.reason = reason;
        this.message = message;
    }
}

module.exports = {
    Categories,
    Reasons,
    OSError
};
