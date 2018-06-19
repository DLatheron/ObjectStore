'use strict';

const consola = require('consola');
const fs = require('fs');
const logger = consola.withScope('Store');
const { promisify } = require('util');

require('padleft');

const Lock = require('./Lock');
const ObjectDetails = require('./ObjectDetails');

const padding = 6;
const paddingCh = '0';

class OSObject {
    constructor(objectId, basePath) {
        this.objectId = objectId;
        this.basePath = basePath;
        this.lock = new Lock(this.basePath);

        // TODO: Only generate once - but this will break tests.
        this.writeFile = promisify(fs.writeFile);
        this.readFile = promisify(fs.readFile);
        this.details = null;

        this.details = {
            latestVersion: 0
        };
    }

    buildMetadataPath(version) {
        return this.basePath +
            `metadata.v${version.toString().padLeft(padding, paddingCh)}.json`;
    }

    async saveMetadata(metadata, version) {
        const filePath = this.buildMetadataPath(version);
        let success = true;

        try {
            await Lock.Acquire(this.lock);
            await this.writeFile(filePath, metadata);
        } catch (error) {
            logger.error(`Unable to create file '${filePath}' because of '${error}'`);
            success = false;
        }

        await Lock.Release(this.lock);

        return success;
    }

    buildContentPath(version) {
        return this.basePath +
            `content.v${version.toString().padLeft(padding, paddingCh)}.bin`;
    }

    async saveContent(content, version) {
        const filePath = this.buildMetadataPath(version);

        try {
            await this.writeFile(filePath, content);

            return true;
        } catch (error) {
            logger.error(`Unable to create directory '${filePath}' because of '${error}'`);
            return false;
        }
    }

    buildDetailsPath() {
        return this.basePath + 'details.json';
    }

    async readDetails() {
        const detailsPath = this.buildDetailsPath();

        try {
            const contents = await this.readFile(detailsPath);
            const jsonContents = JSON.parse(contents);

            this.details = new ObjectDetails(jsonContents);

            return this.details;
        } catch (error) {
            logger.error(`Unable to read file '${detailsPath}' because of '${error}'`);
            return false;
        }
    }

    async writeDetails() {
        const detailsPath = this.buildDetailsPath();

        try {
            await this.writeFile(detailsPath, JSON.stringify(this.details, null, 4), 'utf8');
            return true;
        } catch (error) {
            logger.error(`Unable to write file '${detailsPath}' because of '${error}'`);
            return false;
        }
    }

    async updateObject(incomingStream, metadata) {
        incomingStream = incomingStream || fs.createReadStream();
        metadata = metadata || {};

        // TODO: Lock the file.
        await Lock.Acquire(this.lock);

        const details = await this.readDetails();
        details.latestVersion++;

        const metadataFilename = this.basePath + details.latestVersion.toString() + '.json';
        const contentFilename = this.basePath + details.latestVersion.toString() + '.bin';

        const newVersionStream = fs.createWriteStream(contentFilename);
        incomingStream.pipe(newVersionStream);

        return new Promise((resolve, reject) => {
            // Write the contents from the stream.
            newVersionStream.on('close', () => {
                resolve('end');
            });
            newVersionStream.on('error', (error) => {
                reject(error);
            });
        }).then(() => {
            // Write the metadata.
            return this.writeFile(
                metadataFilename,
                JSON.stringify(metadata, null, 4)
            );
        }).then(() => {
            // Write the updated details.
            return this.writeDetails(details);
        });
    }

    // saveContent(content, version) {

    // }

    // saveStream(stream, version) {}

    // TODO: What functions do we need?
    // - Get the current version;
    // - Get a version;
    // - Set a version;
    // - Set the latest version;
    // - Set permissions;
    // - Determine permissions;
    // - Set metadata;
    // - Set metadata version OR do we version metadata???
}

module.exports = OSObject;
