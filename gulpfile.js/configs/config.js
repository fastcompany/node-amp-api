'use strict';

module.exports = {
  clean: ['docs', 'dist', 'logs/**/*.log'],
  dest: 'dist',
  test: {
    integration: {
      src: [
        'test/utils/load_env_var_util.js',
        'test/integration/**/*.js'
      ]
    },
    unit: {
      src: [
        'test/unit/**/*.js'
      ]
    }
  },
  eslint: {
    conf: {
      rules: {
        'comma-dangle': [2, 'never'],
        'prefer-arrow-callback': ['error', {allowNamedFunctions: true}]
      }
    }
  },
  server: {
    src: ['lib/**/*']
  },
  doc: {
    src: 'lib'
  }
};
