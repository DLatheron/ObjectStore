'use strict';

class UnitTestHelper {
    static createPromise() {
        const temp = {};
        const promise = new Promise((fulfill, reject) => {
            temp.fulfill = function() {
                fulfill.apply(null, arguments);
                return promise;
            };
            temp.reject = function() {
                promise.catch(() => {});
                reject.apply(null, arguments);
                return promise;
            };
        });
        return Object.assign(promise, temp);
    }
}

module.exports = UnitTestHelper;
