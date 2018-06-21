'use strict';

const HttpStatus = require('http-status-codes');
const logger = require('consola');
const request = require('request');
const nconf = require('nconf');

function HandleResponse(resolve, reject, expectedStatusCode, error, response, body) {
    if (error) {
        logger.log(`Error: ${error}`);
        return reject(error);
    }

    if (response.statusCode === expectedStatusCode) {
        logger.log('OK');

        if (body) {
            try {
                const jsonBody = JSON.parse(body);
                resolve(jsonBody);
            } catch (error) {
                reject(error);
            }
        } else {
            resolve({});
        }
    } else {
        logger.error(`Unexpected status code: ${response.statusCode}`);
        reject(response.statusCode, body);
    }
}

async function CreateStore() {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        request.post(
            `http://localhost:${port}/store/create`,
            HandleResponse.bind(this, resolve, reject, HttpStatus.CREATED)
        );
    });
}

async function DeleteStore(storeId) {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        request.delete(
            `http://localhost:${port}/store/${storeId}`,
            HandleResponse.bind(this, resolve, reject, HttpStatus.OK)
        );
    });
}

async function CreateObject(storeId, metadata, stream) {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        request({
            method: 'POST',
            url: `http://localhost:${port}/object/${storeId}/create`,
            formData: {
                metadata: JSON.stringify(metadata, null, 4),
                content: stream
            }
        }, HandleResponse.bind(this, resolve, reject, HttpStatus.CREATED));
    });
}

async function UpdateObject(storeId, objectId, metadata, stream) {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        request({
            method: 'PUT',
            url: `http://localhost:${port}/object/${storeId}/${objectId}`,
            formData: {
                metadata: JSON.stringify(metadata, null, 4),
                content: stream
            }
        }, HandleResponse.bind(this, resolve, reject, HttpStatus.OK));
    });
}

function StringToBuffer(string) {
    return new Buffer(string);
}

module.exports = {
    CreateStore,
    DeleteStore,
    CreateObject,
    UpdateObject,
    StringToBuffer
};
