'use strict';

const dotenv = require('dotenv');
const path = require('path');

const envFilePath = path.resolve(__dirname, '../../', '.env');

dotenv.config({
  silent: true,
  path: envFilePath
});
