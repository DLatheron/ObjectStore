/* globals describe, it, beforeEach, afterEach */
'use strict';

const assert = require('assert');
const consola = require('consola');
const proxyquire = require('proxyquire');
const sinon = require('sinon');
const uuid = require('uuid/v4');

describe('#OSObjectHelper', () => {
    let sandbox;
    let wrapper;
    let OSObjectHelper;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
        wrapper = {
            uuid
        };

        OSObjectHelper = proxyquire('../src/helpers/OSObjectHelper', {
            'uuid/v4': function() { return wrapper.uuid(...arguments); },
        });

        consola.clear();
    });

    afterEach(() => {
        sandbox.verify();
        sandbox.restore();
    });

    describe('#GenerateId', () => {
        it('should generate a v4 uuid', () => {
            sandbox.mock(wrapper)
                .expects('uuid')
                .withExactArgs()
                .once();

            OSObjectHelper.GenerateId();

            sandbox.verify();
        });

        it('should return the generated uuid', () => {
            const expectedId = '123e4567-e89b-12d3-a456-426655440000';
            sandbox.stub(wrapper, 'uuid').returns(expectedId);

            assert.strictEqual(OSObjectHelper.GenerateId(), expectedId);
        });
    });

    describe('#IsValidId', () => {
        [
            { id: '123e4567-e89b-42d3-a456-426655440000', expectedResult: true },
            { id: '123E4567-E89B-42D3-A456-426655440000', expectedResult: true },
            { id: '123e4567e89b-32d3-a456-426655440000', expectedResult: false },
            { id: '123e4567e89b-42d3-a456-426655440000', expectedResult: false },
            { id: 'h23e4567e89b-42d3-a456-426655440000', expectedResult: false },
            { id: 'string', expectedResult: false },
            { id: '', expectedResult: false },
            { id: null, expectedResult: false },
            { id: undefined, expectedResult: false },
            { id: 0, expectedResult: false },
            { id: 1235, expectedResult: false },
            { id: false, expectedResult: false },
            { id: true, expectedResult: false },
        ]
            .forEach(({ id, expectedResult }) => {
                it(`should return ${expectedResult} if the id is ${id}`, () => {
                    assert.strictEqual(OSObjectHelper.IsValidId(id), expectedResult);
                });
            });
    });

    describe('#IdToPath', () => {
        [
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [3, 4], expectedPath: '123/e456/' },
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [3, 3], expectedPath: '123/e45/' },
            { uuid: '123e4567-e89b-12d3-a456-426655440000', hierarchy: [6, 6], expectedPath: '123e45/67e89b/' },
            { uuid: '123e4567e89b12d3a456426655440000', hierarchy: [6, 6], expectedPath: '123e45/67e89b/' },
            { uuid: '123e4567e89b12d3a456426655440000', hierarchy: [6, 6], pathSeparator: '\\', expectedPath: '123e45\\67e89b\\' }
        ]
            .forEach(({ uuid, hierarchy, pathSeparator = '/', expectedPath }) => {
                it(`should split uuid ${uuid} with hierarchy ${hierarchy} into path ${expectedPath} with separator ${pathSeparator}`, () => {
                    assert.strictEqual(OSObjectHelper.IdToPath(uuid, hierarchy, pathSeparator), expectedPath);
                });
            });
    });
});
