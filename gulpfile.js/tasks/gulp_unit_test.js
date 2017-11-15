'use strict';

const mocha = require('gulp-mocha');
const gulp = require('gulp');
const { log } = require('gulp-util');
const config = require('./../configs/config');

const serverUnitTest = () => gulp
  .src(config.test.unit.src, {
    read: false
  })
  .pipe(
    mocha({
      timeout: 10000
    })
  )
  .once('error', (err) => log(err));

gulp.task('unit-test', serverUnitTest);
