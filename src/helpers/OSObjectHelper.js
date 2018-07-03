'use strict';

'use strict';

const uuid = require('uuid/v4');

const idRegex = /^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i;

function GenerateId() {
    return uuid();
}

function IsValidId(id) {
    return !!id.match(idRegex);
}

function IdToPath(id, hierarchy, pathSeparator) {
    const uuidStr = id.toString();
    const uuidStrNoDashes = uuidStr.replace('-', '');
    let uuidLeft = uuidStrNoDashes;

    const keys = hierarchy.map(keyLength => {
        const key = uuidLeft.slice(0, keyLength);
        uuidLeft = uuidLeft.slice(keyLength);
        return key;
    });

    return keys.join(pathSeparator) + pathSeparator;
}

module.exports = {
    GenerateId,
    IsValidId,
    IdToPath
};
