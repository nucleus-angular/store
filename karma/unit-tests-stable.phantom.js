basePath = '..';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'components/store.js/store.js',
  'components/angular/angular.js',
  'components/angular-mocks/angular-mocks.js',
  'tests/libraries/mocker.js',
  '*.js',
  'tests/*.js'
];

preprocessors = {
  '**/*.js': 'coverage'
};

reporters = ['dots', 'coverage'];

autoWatch = false;

browsers = ['PhantomJS'];

singleRun = true;