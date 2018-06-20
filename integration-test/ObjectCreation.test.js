/* globals describe, it, beforeEach */
'use strict';

const assert = require('assert');
const CreationHelper = require('./helpers/CreationHelper');
const TestHelper = require('./helpers/TestHelper');

describe('Object Creation', () => {
    let storeId;

    beforeEach(async () => {
        storeId = (await CreationHelper.createStore()).storeId;
    });

    it('should create a new object', async () => {
        const objectDetails = await CreationHelper.createObject(storeId);
        const objectId = objectDetails.objectId;

        assert.strictEqual(TestHelper.isValidId(objectId), true);
        // TODO: Object directory exists...
        // TODO: Version of the object exists with the correct data...
    });

    // var req = request.post(url, function (err, resp, body) {
    //     if (err) {
    //       console.log('Error!');
    //     } else {
    //       console.log('URL: ' + body);
    //     }
    //   });
    //   var form = req.form();
    //   form.append('file', '<FILE_DATA>', {
    //     filename: 'myfile.txt',
    //     contentType: 'text/plain'
    //   });

    // form.append('file', fs.createReadStream(filepath));

    // OR
    // request({
    //     url: 'http://example.com',
    //     method: 'POST',
    //     formData: {
    //       'regularField': 'someValue',
    //       'regularFile': someFileStream,
    //       'customBufferFile': {
    //         value: fileBufferData,
    //         options: {
    //           filename: 'myfile.bin'
    //         }
    //       }
    //     }
    //   }, handleResponse);
});
