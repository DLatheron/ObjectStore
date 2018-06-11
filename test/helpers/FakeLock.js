'use strict';

const _ = require('lodash');

class LockExpectations {
    constructor() {
        this.expectations = [];
    }

    setSimpleExpectations() {
        this.pushExpectations([
            { operation: 'Acquire', result: true },
            { operation: 'Release', result: true }
        ]);
    }

    popExpectation(shouldBe) {
        if (this.expectations.length === 0) {
            throw Error(`No expectations remaining - expected a ${shouldBe}`);
        }

        const expectation = this.expectations[0];
        this.expectations.splice(0, 1);

        if (shouldBe && shouldBe !== expectation.operation) {
            throw new Error(`Expected a ${shouldBe}, but found a ${expectation.operation}`);
        }

        return expectation;
    }

    pushExpectations(expectationOrExpectations) {
        if (_.isArray(expectationOrExpectations)) {
            expectationOrExpectations.forEach(expectation => this.pushExpectations(expectation));
        } else {
            this.expectations.push(expectationOrExpectations);
        }
    }
}

const lockExpectations = new LockExpectations();

class FakeLock {
    constructor() {
    }

    static Acquire() {
        return lockExpectations.popExpectation('Acquire').result;
    }

    static Release() {
        lockExpectations.popExpectation('Release');
    }
}

module.exports = {
    FakeLock,
    lockExpectations
};
