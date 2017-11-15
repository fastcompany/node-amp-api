'use strict';

const eslint = require('gulp-eslint');
const gulp = require('gulp');
const path = require('path');
const cloneDeep = require('lodash/cloneDeep');
const gulpIf = require('gulp-if');
const config = require('../configs/config');

const configFilePath = path.join(__dirname, './../configs/.eslintrc');

const conf = {
  useEslintrc: false,
  configFile: configFilePath,
  rules: config.eslint.conf.rules
};

const gulpConf = cloneDeep(conf);
gulpConf.rules['import/no-extraneous-dependencies'] = 0;

const testConfig = cloneDeep(config.eslint.conf);
testConfig.rules['prefer-arrow-callback'] = 0;
testConfig.rules['func-names'] = 0;
testConfig.rules['import/no-extraneous-dependencies'] = 0;

const confSrcFix = cloneDeep(conf);
confSrcFix.fix = true;

const confFix = cloneDeep(conf);
confFix.fix = true;
confFix.rules['import/no-extraneous-dependencies'] = 0;

const lintTestsFixConfig = cloneDeep(config.eslint.conf);
lintTestsFixConfig.rules['prefer-arrow-callback'] = 0;
lintTestsFixConfig.rules['func-names'] = 0;
lintTestsFixConfig.rules['import/no-extraneous-dependencies'] = 0;

const isFixed = (file) => file.eslint !== null && file.eslint.fixed;

const lintSrc = () => gulp
    .src('lib/**/*.js')
    .pipe(eslint(conf))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());

gulp.task('js-lint-lib', lintSrc);

const lintGulp = () => gulp
    .src('gulpfile.babel.js/**/*.js')
    .pipe(eslint(gulpConf))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());

gulp.task('js-lint-gulp', lintGulp);

const lintTests = () =>  gulp
    .src('test/**/*.js')
    .pipe(
      eslint({
        useEslintrc: false,
        configFile: configFilePath,
        rules: conf.rules,
        globals: ['$']
      })
    )
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());

gulp.task('js-lint-test', lintTests);

gulp.task(
  'js-lint',
  ['js-lint-lib', 'js-lint-gulp', 'js-lint-test'],
  cb => cb()
);

const lintSrcFix = () => gulp
    .src('lib/**/*.js')
    .pipe(eslint(confSrcFix))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest('lib')));

gulp.task('js-lint-lib-fix', lintSrcFix);

const lintGulpFix = () => gulp
    .src('gulpfile.babel.js/**/*.js')
    .pipe(eslint(confFix))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest('gulpfile.js')));

gulp.task('js-lint-gulp-fix', lintGulpFix);

const lintTestsFix = () => gulp
    .src('test/**/*.js')
    .pipe(
      eslint({
        fix: true,
        useEslintrc: false,
        configFile: configFilePath,
        rules: conf.rules,
        globals: ['$']
      })
    )
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest('test')));

gulp.task('js-lint-test-fix', lintTestsFix);

gulp.task(
  'js-lint-fix',
  ['js-lint-lib-fix', 'js-lint-gulp-fix', 'js-lint-test-fix'],
  cb => cb()
);
