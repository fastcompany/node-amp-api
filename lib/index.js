const P = require('bluebird');
const defaultsDeep = require('lodash/defaultsDeep');
const chunk = require('lodash/chunk');
const { readFileSync } = require('fs');
const NodeRSA = require('node-rsa');
const amphtmlValidator = require('amphtml-validator');

const request = require('./utils/request_util');

class AmpApi {
  constructor(apiKey, log, keyPath) {
    if (!log) {
      // eslint-disable-next-line no-console
      console.log('No logger passed. Using console for logging.');
    }

    // eslint-disable-next-line no-console
    this.log = log || console.log;

    if (!apiKey && !process.env.AMP_API_KEY) {
      log(
        'WARNING: Amp Api declared without google api key, cache update and get unsupported.'
      );
    }
    this.apiKey = apiKey || process.env.AMP_API_KEY;

    if (!keyPath && !process.env.AMP_RSA_PRIVATE_KEY) {
      log(`WARNING: No amp rsa keypath declared, cache update unsupported.`);
    } else {
      const privateKeyPath = keyPath || process.env.AMP_RSA_PRIVATE_KEY;
      this.setUpKeySigning(privateKeyPath);
    }
  }

  setUpKeySigning(path) {
    try {
      const keyData = readFileSync(path);
      this.rsaKey = new NodeRSA(keyData, {
        signingScheme: 'sha256',
        environment: 'node'
      });
    } catch (err) {
      this.log(`ERROR: cannot read ${path}. Cache updating not supported.`);
    }
  }

  validateAmpUrl(url) {
    return amphtmlValidator.getInstance().then(validator =>
      request.getAsync(url).then(res => {
        const result = validator.validateString(res.body);
        if (result.status === 'PASS') {
          return P.resolve('PASS');
        }
        const failError = new Error(`AMP validation failed for url: ${url}
          errors: ${result.errors.join('\n')}
          `);
        failError.ampErrors = result.errors;
        return P.reject(failError);
      })
    );
  }

  parseResponse(res) {
    try {
      return JSON.parse(res.body);
    } catch (err) {
      this.log(`ERROR: error parsing json response ${err.message}`);
      this.log(err.stack);
      return res;
    }
  }

  discover() {
    return request
      .getAsync(
        `https://acceleratedmobilepageurl.googleapis.com/$discovery/rest?version=v1&key=${
          this.apiKey
        }`
      )
      .then(this.parseResponse);
  }

  getAmpCaches() {
    return request
      .getAsync(`https://cdn.ampproject.org/caches.json`)
      .then(this.parseResponse);
  }

  // https://developers.google.com/amp/cache/reference/limits
  // https://developers.google.com/amp/cache/update-cache
  updateCache(host, url, ampAction = 'flush') {
    const hostDasherized = host.split('.').join('-');
    return this.getAmpCaches().then(data =>
      P.all(
        data.caches.map(cache => {
          const apiDomain = cache.updateCacheApiDomainSuffix;
          const timestamp = `&amp_ts=${Math.round(
            new Date().getTime() / 1000.0
          )}`;
          if (this.rsaKey && this.rsaKey.sign) {
            const cacheParams = `/update-cache/c/s/${url}?amp_action=${
              ampAction
            }${timestamp}`;
            const keyEncoded = this.rsaKey.sign(
              Buffer.from(cacheParams, 'utf-8'),
              'base64'
            );
            const signature = `&amp_url_signature=${keyEncoded.toString()}`;
            const cacheUrl = `https://${hostDasherized}.${apiDomain}${
              cacheParams
            }${signature}`;
            return request.getAsync(cacheUrl).then(this.parseResponse);
          }
          return P.reject(new Error('No RSA Key to Sign.'));
        })
      )
    );
  }

  // lookup strategies:
  // "FETCH_LIVE_DOC",
  // "IN_INDEX_DOC"
  /**
   * This version of the Google Accelerated Mobile Page URL API has a default limit of 10
   * queries per 100 seconds. The API is free for now (see Pricing).
   * For the batchGet method, the default limit is 50 AMP URLs each time you call this method.
   */
  batchGet(odata) {
    const data = defaultsDeep(
      {
        lookupStrategy: 'FETCH_LIVE_DOC',
        urls: []
      },
      odata
    );

    if (
      data.lookupStrategy !== 'FETCH_LIVE_DOC' &&
      data.lookupStrategy !== 'IN_INDEX_DOC'
    ) {
      this.log(
        `WARNING: Possible unsupported lookup strategy passed: ${
          data.lookupStrategy
        }`
      );
    }

    if (!data.urls.length) {
      this.log('WARNING: No urls passed to batch add.');
    }

    if (data.urls.length > 50) {
      this.log('WARNING: More than 50 urls passed to batch add.');
      this.log(
        'INFO: Chunking urls to 50 each, making 10 requests per 100 seconds.'
      );
      this.log('INFO: Setting runSafe to true to avoid rate limiting');
      this.limitRate = true;
      const urlSets = chunk(data.urls, 50);
      const requestSets = chunk(urlSets, 10);

      this.log(
        `INFO: ${
          requestSets.length
        } sets of 50 urls. Each wil be executed with a 10 second delay to avoid rate limits.`
      );

      return P.map(
        requestSets,
        function mapRequestSets(urlSet) {
          return request
            .postAsync(
              {
                url: `https://acceleratedmobilepageurl.googleapis.com/v1/ampUrls:batchGet?key=${
                  this.apiKey
                }`,
                body: {
                  lookupStrategy: data.lookupStrategy,
                  urls: urlSet
                },
                json: true
              }.bind(this)
            )
            .delay(10000);
        },
        { concurrency: 1 }
      );
    }

    return request
      .postAsync({
        url: `https://acceleratedmobilepageurl.googleapis.com/v1/ampUrls:batchGet?key=${
          this.apiKey
        }`,
        body: data,
        json: true
      })
      .then(res => {
        if (this.limitRate) {
          return P.delay(10000).then(() => res.body);
        }
        return res.body;
      });
  }
}

module.exports = AmpApi;
