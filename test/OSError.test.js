/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const sinon = require('sinon');

const { OSError, Reasons } = require('../src/OSError');

describe('#OSError', () => {
    let sandbox;
    let osError;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#constructor', () => {
        it('should set the reason property', () => {
            osError = new OSError('reason');

            assert.strictEqual(osError.reason, 'reason');
        });

        it('should set the additional data property', () => {
            osError = new OSError(undefined, 'additionalData');

            assert.strictEqual(osError.additionalData, 'additionalData');
        });

        it('should default the additional data property if not provided', () => {
            osError = new OSError();

            assert.deepStrictEqual(osError.additionalData, {});
        });
    });

    describe('#message', () => {
        it('should build a message from the categeory and message', () => {
            osError = new OSError(Reasons.Default);

            assert.strictEqual(
                osError.message,
                `${Reasons.Default.category}: ${Reasons.Default.message}`
            );
        });

        it('should add additional data if necessary', () => {
            const reason = {
                category: 'Category',
                message: 'Reason containing tokens ${token} and ${otherToken}.'
            };
            const additionalData = {
                token: 'token',
                otherToken: 'other token'
            };

            osError = new OSError(reason, additionalData);

            assert.strictEqual(
                osError.message,
                'Category: Reason containing tokens token and other token.'
            );
        });
    });
});
