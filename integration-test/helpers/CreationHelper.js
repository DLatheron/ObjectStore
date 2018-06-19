'use strict';

const logger = require('consola');
const makeRequest = require('request');
const nconf = require('nconf');

async function createStore() {
    return await new Promise((resolve, reject) => {
        const port = nconf.get('port');
        makeRequest.post(`http://localhost:${port}/store/create`, (error, response, body) => {
            if (error) {
                logger.log('Error');
                return reject('Error');
            }

            logger.log('Done');
            resolve(JSON.parse(body));
        });
    });
}

module.exports = {
    createStore
};
