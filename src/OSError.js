'use strict';

const _ = require('lodash');

const { Reasons, Categories } = require('./OSErrors.json');

_.forIn(
    Reasons,
    reasonAndCategory =>
        reasonAndCategory.category = Categories[reasonAndCategory.category]
);

class OSError {
    constructor(reason, additionalData) {
        this.reason = reason;
        this.additionalData = additionalData;
    }

    get message() {
        let message;

        message = `${this.error.category}: ${this.reason.message}`;
        message += (this.error.additionalReasonData || []).join(this.error.additionalReasonDataSeparator || ', ');

        return message;
    }
}

module.exports = {
    Categories,
    Reasons,
    OSError
};
