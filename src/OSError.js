'use strict';

const _ = require('lodash');

const { Reasons, Categories } = require('./OSErrors.json');

_.forIn(
    Reasons,
    reasonAndCategory =>
        reasonAndCategory.category = Categories[reasonAndCategory.category]
);

function getTokens(message) {
    const regExp = /\${([A-z0-9]*)}/g;

    const matches = [];
    let match = regExp.exec(message);
    while (match != null) {
        matches.push(match[1]);
        match = regExp.exec(message);
    }

    return matches;
}

class OSError {
    constructor(reason, additionalData = {}) {
        this.reason = reason;
        this.additionalData = additionalData;
    }

    get message() {
        let message;

        message = `${this.reason.category}: ${this.reason.message}`;

        getTokens(message).forEach(token => {
            message = message.replace('${' + token + '}', this.additionalData[token]);
        });

        return message;
    }
}

module.exports = {
    Categories,
    Reasons,
    OSError
};
