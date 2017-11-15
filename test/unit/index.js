'use strict';

const type = require('type-detect');
const { expect } = require('chai');

const log = require('bunyan').createLogger({
  name: 'test'
});

const AmpApi = require('../../lib');

const ampApi = new AmpApi();

describe('#AmpApi unit tests: ', () => {
  it('it should be a function', () => {
    expect(type(AmpApi)).to.equal('function');
  });

  it('it should be an object after instantiated', () => {
    expect(type(ampApi)).to.equal('Object');
  });

  /* eslint-disable no-console */
  it('it should have default logging methods', () => {
    ['info', 'warn', 'error'].forEach(method => {
      expect(console[method]).to.equal(ampApi.log[method]);
    });
    expect(console.error).to.equal(ampApi.log.fatal);
  });
  /* eslint-enable no-console */

  it('it should be able to take a custom logger', () => {
    const ampApiLog = new AmpApi({ log });

    ['info', 'warn', 'error', 'fatal'].forEach(method => {
      expect(log[method]).to.equal(ampApiLog.log[method]);
    });
  });

  it('it should fail gracefully with invalid args', () => {
    const ampApiInvalid = new AmpApi({
      apiKey: 'test',
      log: {},
      keyPath: 'test'
    });
    expect(type(ampApiInvalid)).to.equal('Object');
  });
});
