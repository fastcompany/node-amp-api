'use strict';

const P = require('bluebird');
const r = require('request');

const request = P.promisifyAll(r);

module.exports = request;
