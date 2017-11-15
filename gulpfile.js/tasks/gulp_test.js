'use strict';

const runSequence = require('run-sequence');
const gulp = require('gulp');
const { log } = require('gulp-util');

const run = (cb) => runSequence(
    'js-lint-lib',
    'js-lint-test',
    'js-lint-gulp',
    'unit-test',
    'integration-test',
    err => {
      if (err) {
        const exitCode = 2;
        log(`[FAIL] gulp build task failed - exiting with code ${exitCode}`);
        return process.exit(exitCode);
      }
      return cb();
    }
  );

gulp.task('test', run);
