'use strict';

const P = require('bluebird');
const defaultsDeep = require('lodash/defaultsDeep');
const chunk = require('lodash/chunk');
const { readFileSync } = require('fs');
const NodeRSA = require('node-rsa');
const amphtmlValidator = require('amphtml-validator');
const base64Web = require('urlsafe-base64');
const parseUrl = require('url').parse;

const request = require('./utils/request_util');

/* eslint-disable no-console */
const defaultLog = {
  info: console.info,
  warn: console.warn,
  error: console.error,
  fatal: console.error
};
/* eslint-enable no-console */

class AmpApi {
  constructor(conf = {}) {
    const { apiKey, log, keyPath } = conf;
    const validLog = log && log.info && log.warn && log.error && log.fatal;

    if (validLog) {
      this.log = log;
    } else {
      this.log = defaultLog;
      this.log.warn(
        'No logger passed or invalid logger. Using console defaults for logging.'
      );
    }

    this.apiKey = apiKey || process.env.AMP_API_KEY;

    if (!apiKey && !process.env.AMP_API_KEY) {
      this.log.warn(
        'Amp Api declared without google api key, cache update and get unsupported.'
      );
    }

    if (!keyPath && !process.env.AMP_RSA_PRIVATE_KEY) {
      this.log.warn(`No amp rsa keypath declared, cache update unsupported.`);
    } else {
      const privateKeyPath = keyPath || process.env.AMP_RSA_PRIVATE_KEY;
      this.setUpKeySigning(privateKeyPath);
    }

    this.ampHtmlValidator = amphtmlValidator.getInstance();
    this.parseResponse = this.parseResponse.bind(this);
  }

  setUpKeySigning(path) {
    try {
      const keyData = readFileSync(path);
      this.rsaKey = new NodeRSA(keyData, {
        signingScheme: 'sha256',
        environment: 'node'
      });
    } catch (err) {
      this.log.fatal(
        `Cannot read private key ${path}. Cache updating not supported.`
      );
    }
  }

  validateAmpUrl(url) {
    return this.ampHtmlValidator.then(validator =>
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
      this.log.error(`Error parsing json response ${err.message}`);
      this.log.error(err.stack);
      this.log.error(`Error parsing: ${res.body}`);
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
  updateCache(ourl, contentType = 'c', ampAction = 'flush') {
    // todo: validate url here
    const { host, pathname } = parseUrl(ourl);
    // see https://developers.google.com/amp/cache/overview#amp-cache-url-format
    const doubleDashHost = host.replace('-', '--');
    const hostDasherized = doubleDashHost.split('.').join('-');
    const url = [host, pathname].join('');

    return this.getAmpCaches().then(data =>
      P.all(
        data.caches.map(cache => {
          const apiDomain = cache.updateCacheApiDomainSuffix;
          const timestamp = `&amp_ts=${Math.round(
            new Date().getTime() / 1000.0
          )}`;
          if (this.rsaKey && this.rsaKey.sign) {
            const cacheParams = `/update-cache/${contentType}/s/${
              url
            }?amp_action=${ampAction}${timestamp}`;
            const keySigned = this.rsaKey.sign(
              Buffer.from(cacheParams, 'utf-8')
            );
            const signature = `&amp_url_signature=${base64Web.encode(
              keySigned
            )}`;
            const cacheUrl = `https://${hostDasherized}.${apiDomain}${
              cacheParams
            }${signature}`;
            return request.getAsync(cacheUrl);
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
      this.log.warn(
        `Possible unsupported lookup strategy passed: ${data.lookupStrategy}`
      );
    }

    if (!data.urls.length) {
      this.log.warn('No urls passed to batch add.');
    }

    if (data.urls.length > 50) {
      this.log.info('More than 50 urls passed to batch add.');
      this.log.info(
        'Chunking urls to 50 each, making 10 requests per 100 seconds.'
      );
      this.log.info('Setting limitRate to true to avoid rate limiting');
      this.limitRate = true;
      const urlSets = chunk(data.urls, 50);
      const requestSets = chunk(urlSets, 10);

      this.log.info(
        `${
          requestSets.length
        } sets of 50 urls. Each wil be executed with a 10 second delay to avoid rate limits.`
      );

      return P.map(
        requestSets,
        urlSet =>
          request
            .postAsync({
              url: `https://acceleratedmobilepageurl.googleapis.com/v1/ampUrls:batchGet?key=${
                this.apiKey
              }`,
              body: {
                lookupStrategy: data.lookupStrategy,
                urls: urlSet
              },
              json: true
            })
            .delay(10000),
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
