'use strict';

const type = require('type-detect');
const { expect } = require('chai');

const AmpApi = require('../../lib');

// Loads in from environment vars.
const ampApi = new AmpApi();

describe('#AmpApi integration tests: ', () => {
  it('discovers the api', () =>
    ampApi.discover().then(data => {
      expect(type(data)).to.equal('Object');
    }));

  it('validates correct amp pages', () =>
    ampApi
      .validateAmpUrl(
        'https://amp.fastcompany.com/40467645/how-pie-became-a-powerful-punchline-in-political-provocation'
      )
      .then(data => {
        expect(data).to.equal('PASS');
      }));

  it('invalidates non pages', () =>
    ampApi
      .validateAmpUrl(
        'https://fastcompany.com/40467645/how-pie-became-a-powerful-punchline-in-political-provocation'
      )
      .then(data => {
        expect(data).to.equal('PASS');
      })
      .catch(data => {
        expect(type(data)).to.equal('Error');
      }));

  it('loads data to google and can update cache', () =>
    ampApi
      .batchGet({
        lookupStrategy: 'FETCH_LIVE_DOC',
        urls: [
          'https://amp.fastcompany.com/40491026/james-corden-lives-in-the-moment-heres-how'
        ]
      })
      .then(data => {
        expect(type(data)).to.equal('Object');
        return data;
      })
      .then(data => {
        const { ampUrl } = data.ampUrls[0];
        return ampApi.updateCache(ampUrl).then(res => {
          expect(res[0].body).equal('OK');
        });
      }));
});
