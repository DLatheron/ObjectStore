/* globals describe, it, beforeEach */
'use strict';

const assert = require('assert');

const CreationHelper = require('./helpers/CreationHelper');
const TestHelper = require('./helpers/TestHelper');

describe('Object Creation', () => {
    let storeId;

    beforeEach(async () => {
        const storeDetails = await CreationHelper.createStore();
        storeId = storeDetails.storeId;
    });

    it('should create a new object', async () => {
        const content = CreationHelper.stringToBuffer('some fake content - that is really long indeed');
        const metadata = {
            myData: 'Some value',
            bool: true,
            number: 5462
        };
        const objectDetails = await CreationHelper.createObject(storeId, content, metadata);

        const failure = TestHelper.objectExists(objectDetails, {
            expectedVersion: 1,
            expectedMetadata: metadata,
            expectedContent: content
        });
        assert(!failure, failure);
    });
});
