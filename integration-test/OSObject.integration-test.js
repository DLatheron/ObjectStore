/* globals describe, it, beforeEach */
'use strict';

const assert = require('assert');

const CreationHelper = require('./helpers/CreationHelper');
const TestHelper = require('./helpers/TestHelper');

describe('Object Creation', () => {
    const fileContents = {
        version1: CreationHelper.StringToBuffer('Version 1 of the file'),
        version2: CreationHelper.StringToBuffer('Version 2 of the file - which is much bigger'),
        version3: CreationHelper.StringToBuffer('Version 3 of the file - which is smaller')
    };
    const fileMetadata = {
        version1: {
            myVersion: 'Version 1',
            bool: true,
            number: 5462
        },
        version2: {
            myVersion: 'Version 2',
            bool: false,
            number: 3722
        },
        version3: {
            myVersion: 'Version 3',
            bool: true,
            number: 9552
        }
    };
    let storeId;

    beforeEach(async () => {
        const storeDetails = await CreationHelper.CreateStore();
        storeId = storeDetails.storeId;
    });

    it('should create a new object', async () => {
        const objectDetails = await CreationHelper.CreateObject(
            storeId,
            fileMetadata.version1,
            fileContents.version1
        );

        const failure = TestHelper.ObjectExists(objectDetails, {
            expectedVersion: 1,
            expectedMetadata: fileMetadata.version1,
            expectedContents: fileContents.version1
        });
        assert(!failure, failure);
    });

    it('should update a previously created object', async () => {
        let objectDetails = await CreationHelper.CreateObject(
            storeId,
            fileMetadata.version1,
            fileContents.version1
        );

        objectDetails = await CreationHelper.UpdateObject(
            storeId,
            objectDetails.objectId,
            fileMetadata.version2,
            fileContents.version2
        );

        const failure = TestHelper.ObjectExists(objectDetails, {
            expectedVersion: 2,
            expectedMetadata: fileMetadata.version2,
            expectedContents: fileContents.version2
        });
        assert(!failure, failure);
    });

    it('should update a previously created object', async () => {
        let objectDetails = await CreationHelper.CreateObject(
            storeId,
            fileMetadata.version1,
            fileContents.version1
        );
        objectDetails = await CreationHelper.UpdateObject(
            storeId,
            objectDetails.objectId,
            fileMetadata.version2,
            fileContents.version2
        );
        objectDetails = await CreationHelper.UpdateObject(
            storeId,
            objectDetails.objectId,
            fileMetadata.version3,
            fileContents.version3
        );

        const failure = TestHelper.ObjectExists(objectDetails, {
            expectedVersion: 3,
            expectedMetadata: fileMetadata.version3,
            expectedContents: fileContents.version3
        });
        assert(!failure, failure);
    });
});
