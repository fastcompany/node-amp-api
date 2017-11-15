'use strict';

const mocha = require('gulp-mocha');
const gulp = require('gulp');
const { log } = require('gulp-util');
const config = require('./../configs/config');

const integrationTest = () => gulp
    .src(config.test.integration.src, {
      read: false
    })
    .pipe(
      mocha({
        timeout: 10000
      })
    )
    .once('error', (err) => log(err));

gulp.task('integration-test', integrationTest);
