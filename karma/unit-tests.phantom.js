module.exports = function(config) {
  config.set({
    autoWatch: false,
    basePath: '..',
    frameworks: ['mocha', 'chai', 'sinon'],
    browsers: ['PhantomJS'],
    singleRun: true,
    preprocessors: {},
    files: [
      'components/lodash/dist/lodash.js',
      'components/store.js/store.js',
      'components/angular/angular.js',
      'components/angular-mocks/angular-mocks.js',
      'tests/libraries/mocker.js',
      'module.js',
      'store-factory.js',
      'tests/*.js'
    ]
  });
};