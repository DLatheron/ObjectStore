'use strict';

const fs = require('fs');

require('padleft');

const AsyncOps = require('./helpers/AsyncOps');
const { Reasons, OSError } = require('./OSError');
const VersionLock = require('./VersionLock');

const PADDING = 6;
const PADDING_CH = '0';
const FIRST_VERSION = 1;

class OSObject {
    constructor(storeId, objectId, basePath) {
        this.storeId = storeId;
        this.objectId = objectId;
        this.basePath = basePath;
    }

    _buildMetadataPath(version) {
        return this.basePath +
            `metadata.v${version.toString().padLeft(PADDING, PADDING_CH)}.json`;
    }

    async _updateMetadata(version, metadata) {
        if (metadata) {
            const metadataFilename = this._buildMetadataPath(version);

            await AsyncOps.WriteWholeFile(metadataFilename, JSON.stringify(metadata, null, 4));
        }
    }

    _buildContentPath(version) {
        return this.basePath +
            `content.v${version.toString().padLeft(PADDING, PADDING_CH)}.bin`;
    }

    async _updateContent(version, incomingStream) {
        if (incomingStream) {
            return await new Promise((resolve, reject) => {
                const contentFilename = this._buildContentPath(version);
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

    async createObject() {
        const versionLock = new VersionLock(this.basePath);

        await versionLock.create({ latestVersion: FIRST_VERSION });

        return {
            storeId: this.storeId,
            objectId: this.objectId,
            version: FIRST_VERSION
        };
    }

    async updateObject(incomingStream, metadata) {
        const versionLock = new VersionLock(this.basePath);
        let lockContents;

        try {
            lockContents = await versionLock.getContents({
                latestVersion: currentVersion => currentVersion + 1
            });
        } catch (error) {
            error.additionalData = {
                storeId: this.storeId,
                objectId: this.objectId
            };
            throw error;
        }

        const { latestVersion } = lockContents;

        try {
            await this._updateContent(latestVersion, incomingStream);
            await this._updateMetadata(latestVersion, metadata);
        } catch (error) {
            throw new OSError(Reasons.ContentWriteError, {
                storeId: this.storeId,
                objectId: this.objectId
            });
        }

        return {
            storeId: this.storeId,
            objectId: this.objectId,
            version: latestVersion
        };
    }

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
