'use strict';

const consola = require('consola');
const HttpStatus = require('http-status-codes');
const OSBase = require('../OSBase');
const _ = require('lodash');

const logger = consola.withScope('ObjectRoute');

class ObjectRoute {
    constructor({ app, storeManager }) {
        this.app = app;
        this.storeManager = storeManager;
    }

    initRoute() {
        this.app.post(
            '/object/:storeId/create',
            this.createObject.bind(this)
        );
        this.app.get(
            '/object/:storeId/:objectId',
            this.getObject.bind(this)
        );
        this.app.put(
            '/object/:storeId/:objectId',
            this.updateObject.bind(this)
        );
        // this.app.delete(
        //     '/object/:storeId/:objectId',
        //     this.deleteObject.bind(this)
        // );
    }

    validateRequest(request, expectations) {
        // TODO: Retrieve permissions for this user.
        let userPermissions = 'create|read|update|delete';

        if (!userPermissions.includes(expectations.permissions)) {
            return {
                status: HttpStatus.UNAUTHORIZED,
                reason: 'Insufficient permission to create an object'
            };
        }

        if (expectations.storeId) {
            if (!OSBase.IsValidId(_.get(request, 'params.storeId'))) {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    reason: 'Invalid store id specified'
                };
            }
        }
        if (expectations.objectId) {
            if (!OSBase.IsValidId(_.get(request, 'params.objectId'))) {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    reason: 'Invalid object id specified'
                };
            }
        }

        if (expectations.contentType) {
            if (!_.get(request, 'headers.content-type').startsWith(expectations.contentType)) {
                return {
                    status: HttpStatus.BAD_REQUEST,
                    reason: 'Expected multipart/form-data upload'
                };
            }
        }
    }

    _streamContentAndMetadata(request, osObject) {
        return new Promise((resolve, reject) => {
            let metadata;

            request.busboy.on('field', function(fieldName, value, fieldNameTruncated, valueTruncated, encoding, mimeType) {
                logger.log(`Field [${fieldName} ]: value: ${value}, encoding: ${encoding}, mimeType: ${mimeType}`);
                if (fieldName === 'metadata') {
                    try {
                        metadata = JSON.parse(value);
                    } catch (error) {
                        reject({
                            status: HttpStatus.BAD_REQUEST,
                            reason: 'Received metadata is not valid JSON'
                        });
                    }
                }
            });
            request.busboy.on('file', async (fieldName, incomingStream, filename, encoding, mimeType) => {
                logger.log(`File [${fieldName}]: filename: ${filename}, encoding: ${encoding}, mimetype: ${mimeType}`);
                if (fieldName === 'file') {
                    const results = await osObject.updateObject(incomingStream, metadata);

                    resolve({
                        objectId: osObject.objectId,
                        latestVersion: results.latestVersion
                    });
                }
            });

            request.pipe(request.busboy);
        });
    }

    async createObject(request, response) {
        // Note:
        // - Metadata and content as always sent together - BUT both are optional
        //   and are replaced with {} or a zero-length file if not present.

        const validationFailure = this.validateRequest(request, {
            permissions: 'create',
            storeId: true,
            contentType: 'multipart/form-data'
        });
        if (validationFailure) {
            return response.status(validationFailure.status)
                .send(validationFailure.reason);
        }

        const storeId = request.params.storeId;
        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response
                .status(HttpStatus.NOT_FOUND)
                .send(`Store ${storeId} does not exist`);
        }

        const osObject = await store.createObject(storeId);
        if (!osObject) {
            return response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send('Failed to create object');
        }

        await this._streamContentAndMetadata(request, osObject)
            .then((result) => {
                return response
                    .status(200)
                    .send(result);
            })
            .catch(({ status, reason }) => {
                return response
                    .status(status)
                    .send(reason);
            });
    }

    async getObject(request, response) {
        const validationFailure = this.validateRequest(request, {
            permissions: 'read',
            storeId: true,
            objectId: true
        });
        if (validationFailure) {
            return response
                .status(validationFailure.status)
                .send(validationFailure.reason);
        }

        const storeId = request.params.storeId;
        const objectId = request.params.objectId;

        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response
                .status(HttpStatus.NOT_FOUND)
                .send(`Store ${storeId} does not exist`);
        }

        const osObject = await store.getObject(objectId);
        if (!osObject) {
            return response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send('Failed to create object');
        }

        return response.send({
            // TODO: Stream the object to them.
        });
    }

    async updateObject(request, response) {
        const validationFailure = this.validateRequest(request, {
            permissions: 'update',
            storeId: true,
            objectId: true,
            contentType: 'multipart/form-data'
        });
        if (validationFailure) {
            return response
                .status(validationFailure.status)
                .send(validationFailure.reason);
        }

        const storeId = request.params.storeId;
        const objectId = request.params.objectId;

        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response
                .status(HttpStatus.NOT_FOUND)
                .send(`Store ${storeId} does not exist`);
        }

        const osObject = await store.getObject(objectId);
        if (!osObject) {
            return response
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .send('Failed to create object');
        }

        await this._streamContentAndMetadata(request, osObject)
            .then((result) => {
                return response
                    .status(200)
                    .send(result);
            })
            .catch(({ status, reason }) => {
                return response
                    .status(status)
                    .send(reason);
            });
    }

    // deleteObject() {

    // }
}

module.exports = ObjectRoute;
