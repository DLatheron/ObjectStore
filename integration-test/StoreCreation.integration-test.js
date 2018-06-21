/* globals describe, it */
'use strict';

const assert = require('assert');
const CreationHelper = require('./helpers/CreationHelper');
const TestHelper = require('./helpers/TestHelper');

describe('Store Creation', () => {
    it('should create a new store', async () => {
        const storeDetails = await CreationHelper.CreateStore();
        const storeId = storeDetails.storeId;

        assert.strictEqual(TestHelper.IsValidId(storeId), true);
        assert.strictEqual(await TestHelper.StoreDirectoryExists(storeId), true);
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
