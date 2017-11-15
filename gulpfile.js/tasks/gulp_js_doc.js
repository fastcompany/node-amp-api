'use strict';

const gulp = require('gulp');
const esdoc = require('gulp-esdoc');

gulp.task('js-doc', function jsDoc() {
  gulp.src(['src']).pipe(
    esdoc({
      destination: 'docs/js'
    })
  );
});
