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

            return new ObjectDetails(jsonContents);
        } catch (error) {
            logger.error(`Unable to read file '${detailsPath}' because of '${error}'`);
            return false;
        }
    }

    async writeDetails(details) {
        const detailsPath = this.buildDetailsPath();

        try {
            await this.writeFile(detailsPath, JSON.stringify(details, null, 4), 'utf8');
            return true;
        } catch (error) {
            logger.error(`Unable to write file '${detailsPath}' because of '${error}'`);
            return false;
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
