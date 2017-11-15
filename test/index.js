/* eslint-disable */

// TODO: write real tests for this

const AmpApi = require('../index');

const ampApi = new AmpApi(
  undefined,
  console.log,
  '/Users/mbenin/Desktop/node-amp-api/private-key.pem'
);

ampApi
  .batchGet({
    lookupStrategy: 'FETCH_LIVE_DOC',
    urls: [
      'https://amp.fastcompany.com/40491026/james-corden-lives-in-the-moment-heres-how'
    ]
  })
  .then(function(data) {
    console.log(data);
    process.exit();
  })
  .catch(function(err) {
    console.error(err);
    process.exit(err);
  });

/*
ampApi.updateCache(
  'amp.fastcompany.com',
  'amp.fastcompany.com/40491026/james-corden-lives-in-the-moment-heres-how'
).then(function(data) {
  console.log(data);
  process.exit();
}).catch(function(err) {
  console.error(err);
  process.exit(err);
});
*/
