'use strict';

const consola = require('consola');
const fs = require('fs');
const logger = consola.withScope('Store');
const { promisify } = require('util');

require('padleft');

const padding = 6;
const paddingCh = '0';

class Object {
    constructor(basePath) {
        this.basePath = basePath;
        this.writeFile = promisify(fs.writeFile);
    }

    buildMetadataPath(version) {
        return this.basePath +
            `metadata.v${version.toString().padLeft(padding, paddingCh)}.json`;
    }

    async saveMetadata(metadata, version) {
        const filePath = this.buildMetadataPath(version);

        try {
            await this.writeFile(filePath, metadata);

            return true;
        } catch (error) {
            logger.error(`Unable to create directory '${filePath}' because of '${error}'`);
            return false;
        }
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

module.exports = Object;
