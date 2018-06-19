'use strict';

const consola = require('consola');
const HttpStatus = require('http-status-codes');

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

    async createObject(request, response) {
        // TODO: Check that we are able to create an object.
        const storeId = request.params.storeId;
        // TODO: Validate request.

        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response.status(HttpStatus.NOT_FOUND)
                .status(`Store ${storeId} does not exist`);
        }

        const osObject = await store.createObject(storeId);
        if (!osObject) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .status('Failed to create object');
        }

        const results = {
            objectId: osObject.objectId
        };

        let metadata;

        request.busboy.on('field', function(fieldName, value, fieldNameTruncated, valueTruncated, encoding, mimeType) {
            logger.log(`Field [${fieldName} ]: value: ${value}, encoding: ${encoding}, mimeType: ${mimeType}`);
            try {
                metadata = JSON.parse(value);
            } catch (error) {
                logger.error(`Recevied metadata is not valid JSON: ${value}`);
            }
        });
        request.busboy.on('file', async (fieldName, incomingStream, filename, encoding, mimeType) => {
            logger.log(`File [${fieldName}]: filename: ${filename}, encoding: ${encoding}, mimetype: ${mimeType}`);

            await osObject.updateObject(incomingStream, metadata);

            return response.send(results);
        });

        request.pipe(request.busboy);
    }

    async getObject(request, response) {
        // TODO: Check that we are able to get an object.
        const storeId = request.params.storeId;
        const objectId = request.params.objectId;
        // TODO: Validate request.

        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response.status(HttpStatus.NOT_FOUND)
                .status(`Store ${storeId} does not exist`);
        }

        const osObject = await store.getObject(objectId);
        if (!osObject) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .status('Failed to create object');
        }

        // if (request.headers['accept-encoding'] === 'application/json') {
        //     // TODO: Decide if this is a JSON file.
        // }

        return response.send({
            // TODO: Stream the object to them.
        });
    }

    async updateObject(request, response) {
        // TODO: Check that we are able to get an object.
        const storeId = request.params.storeId;
        const objectId = request.params.objectId;
        // TODO: Validate request.

        const store = await this.storeManager.getStore(storeId);
        if (!store) {
            return response.status(HttpStatus.NOT_FOUND)
                .status(`Store ${storeId} does not exist`);
        }

        const osObject = await store.getObject(objectId);
        if (!osObject) {
            return response.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .status('Failed to create object');
        }

        // let fstream;
        request.pipe(request.busboy);
        request.busboy.on('file', async (fieldName, incomingStream, filename) => {
            logger.log(`Uploading: ${fieldName} = ${filename}`);

            osObject.updateObject(incomingStream);
            // TODO: Pass the stream to the osObject.update() function - on return we can respond.

            // fstream = fs.createWriteStream(__dirname + '/files/' + filename);
            // file.pipe(fstream);
            // fstream.on('close', function () {
            //     response.redirect('back');
            // });

            return response.sendStatus(HttpStatus.OK);
        });
    }

    // deleteObject() {

    // }
}

module.exports = ObjectRoute;
