'use strict';

const logger = require('consola');
const makeRequest = require('request');
const nconf = require('nconf');

async function createStore() {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        makeRequest.post(
            `http://localhost:${port}/store/create`,
            (error, response, body) => {
                if (error) {
                    logger.log(`Error: ${error}`);
                    return reject(error);
                }

                if (response.statusCode === 200) {
                    logger.log('OK');
                    try {
                        const jsonBody = JSON.parse(body);
                        resolve(jsonBody);
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(response.statusCode, body);
                }
            }
        );
    });
}

async function deleteStore(storeId) {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        makeRequest.delete(
            `http://localhost:${port}/store/${storeId}`,
            (error, response, body) => {
                if (error) {
                    logger.log(`Error: ${error}`);
                    return reject(error);
                }

                if (response.statusCode === 200) {
                    logger.log('OK');
                    resolve();
                } else {
                    logger.log(response.statusCode);
                    reject(response.statusCode, body);
                }
            }
        );
    });
}

async function createObject(storeId, stream, metadata) {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');

        makeRequest({
            method: 'POST',
            url: `http://localhost:${port}/object/${storeId}/create`,
            formData: {
                metadata: JSON.stringify(metadata, null, 4),
                content: stream
            }
        }, (error, response, body) => {
            if (error) {
                logger.log(`Error: ${error}`);
                return reject(error);
            }

            if (response.statusCode === 200) {
                logger.log('OK');
                try {
                    const jsonBody = JSON.parse(body);
                    resolve(jsonBody);
                } catch (error) {
                    reject(error);
                }
            } else {
                logger.log(response.statusCode);
                reject(response.statusCode, body);
            }
        });
    });
}

function stringToBuffer(string) {
    return new Buffer(string);
}

module.exports = {
    createStore,
    deleteStore,
    createObject,
    stringToBuffer
};
