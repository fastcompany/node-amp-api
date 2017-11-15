const config = {
  clean: ['docs', 'dist', 'logs/**/*.log'],
  dest: 'dist',
  test: {
    server: {
      integration: {
        src: [
          'test/server/utils/test_initializer_util.js',
          'test/server/integration/**/*.js',
          'test/server/utils/test_teardown_util.js'
        ]
      },
      unit: {
        src: [
          'test/server/utils/test_initializer_utils.js',
          'test/server/utils/enzyme_initializer.js',
          'test/shared/utils/**/*.js',
          'test/shared/**/*.js',
          'test/server/unit/**/*.js'
        ]
      }
    }
  },
  eslint: {
    conf: {
      rules: {
        'comma-dangle': [2, 'never'],
        'prefer-arrow-callback': ['error', { allowNamedFunctions: true }]
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

export default config;
