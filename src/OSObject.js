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
    constructor(storeId, objectId, basePath) {
        this.storeId = storeId;
        this.objectId = objectId;
        this.basePath = basePath;
        this.lock = new Lock(this.basePath);

        // TODO: Only generate once - but this will break tests.
        this.writeFile = promisify(fs.writeFile);
        this.readFile = promisify(fs.readFile);
        this.details = null;
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

    async _readDetails() {
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

    async _writeDetails() {
        const detailsPath = this.buildDetailsPath();

        await this.writeFile(detailsPath, JSON.stringify(this.details, null, 4), 'utf8');
        return true;
    }

    _updateContent(version, incomingStream) {
        if (incomingStream) {
            return new Promise((resolve, reject) => {
                const contentFilename = this.buildContentPath(version);
                const newVersionStream = fs.createWriteStream(contentFilename);
                incomingStream.pipe(newVersionStream);

                // Write the contents from the stream.
                newVersionStream.on('close', () => {
                    resolve('end');
                });
                newVersionStream.on('error', (error) => {
                    reject(error);
                });
            });
        }
    }

    async _updateMetadata(version, metadata) {
        if (metadata) {
            const metadataFilename = this.buildMetadataPath(version);

            await this.writeFile(metadataFilename, JSON.stringify(metadata, null, 4));
        }
    }

    async updateObject(incomingStream, metadata) {
        try {
            await Lock.Acquire(this.lock);

            const details = await this._readDetails();
            details.latestVersion++;

            await this._updateContent(details.latestVersion, incomingStream);
            await this._updateMetadata(details.latestVersion, metadata);
            await this._writeDetails(details);
            await Lock.Release(this.lock);

            return {
                storeId: this.storeId,
                objectId: this.objectId,
                latestVersion: details.latestVersion
            };
        } catch (error) {
            await Lock.Release(this.lock);
            return;
        }
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
