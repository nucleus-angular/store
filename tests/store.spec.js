describe('Store', function(){
  var nagStore, $timeout, $httpBackend, $exceptionHandler;

  beforeEach(module('nag.store'));

  beforeEach(module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function($injector) {
    nagStore = $injector.get('nagStore');
    $timeout = $injector.get('$timeout');
    $httpBackend = $injector.get('$httpBackend');
    $exceptionHandler = $injector.get('$exceptionHandler');

    store.remove('test');
    store.remove('test2');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it("should be able to set/get data", function() {
    expect(nagStore.get('test')).toBeUndefined();

    nagStore.set('test', 'data');

    expect(nagStore.get('test')).toBe('data');
  });

  it("should be able to set/get data with an expire time", function() {
    nagStore.set('test', 'data', 100);

    //todo: investigate: for whatever reason FireFox needs the timeout to be a little bit higher for it to work
    waitsFor(function() {
      return nagStore.get('test') !== 'data';
    }, "data did not expire", 500);

    runs(function() {
      expect(nagStore.get('test')).toBeUndefined();
    });
  });

  it("should be able to remove data", function() {
    nagStore.set('test', 'data');
    nagStore.remove('test', 'data');

    expect(nagStore.get('test')).toBeUndefined();
  });

  it("should be able to configure a key with a remote resource and caching time", function() {
    var responseData = [{
      id: 1,
      title: 'test 1'
    }, {
      id: 2,
      title: 'test 2'
    }, {
      id: 3,
      title: 'test 3'
    }];

    nagStore.registerKey('test', '/api/test', 100, function(response) {
      return response.response.data;
    });

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [200, {
        response: {
          status: 'success',
          data: responseData
        }
      }, {}];
    });
    var test;

    nagStore.get('test').then(function(data) {
      test = data;
    });
    $httpBackend.flush();

    expect(test).toEqual(responseData);
  });

  it("should be able to pass in $http options object instead of just url string when registering a key", function() {
    var responseData = [{
      id: 1,
      title: 'test 1'
    }, {
      id: 2,
      title: 'test 2'
    }, {
      id: 3,
      title: 'test 3'
    }];

    nagStore.registerKey('test', {
      method: 'GET',
      url: '/api/test'
    }, 100, function(response) {
      return response.response.data;
    });

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [200, {
        response: {
          status: 'success',
          data: responseData
        }
      }, {}];
    });
    var test;

    nagStore.get('test').then(function(data) {
      test = data;
    });
    $httpBackend.flush();

    expect(test).toEqual(responseData);
  });

  it("should not make a http request for the data when a registered keys has not expired", function() {
    var responseData = [{
      id: 1,
      title: 'test 1'
    }, {
      id: 2,
      title: 'test 2'
    }, {
      id: 3,
      title: 'test 3'
    }];

    nagStore.registerKey('test', {
      method: 'GET',
      url: '/api/test'
    }, 100, function(response) {
      return response.response.data;
    });

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [200, {
        response: {
          status: 'success',
          data: responseData
        }
      }, {}];
    });
    var test;

    nagStore.get('test').then(function(data) {
      test = data;
    });
    $httpBackend.flush();

    //this second time should not trigger a request for the data
    test = nagStore.get('test');

    expect(test).toEqual(responseData);
  });

  it("should refetch data automatically when registered key expires", function() {
    var responseData = [{
      id: 1,
      title: 'test 1'
    }, {
      id: 2,
      title: 'test 2'
    }, {
      id: 3,
      title: 'test 3'
    }];

    nagStore.registerKey('test', {
      method: 'GET',
      url: '/api/test'
    }, 100, function(response) {
      return response.response.data;
    });

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [200, {
        response: {
          status: 'success',
          data: responseData
        }
      }, {}];
    });
    var test;

    nagStore.get('test');
    $httpBackend.flush();

    //todo: investigate: for whatever reason FireFox needs the timeout to be a little bit higher for it to work
    waitsFor(function() {
      var tmp;
      tmp = nagStore.get('test');
      if(tmp.then) {
        $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
          return [200, {
            response: {
              status: 'success',
              data: responseData
            }
          }, {}];
        });
        tmp.then(function(data) {
          test = data;
        });
        $httpBackend.flush();

        expect(test).toEqual(responseData);

        return true;
      }
    }, "data to expire", 500);

  });

  it("should be able to pass an object with both a success and error callback instead of just a success callback", function() {
    var responseData = [{
      id: 1,
      title: 'test 1'
    }, {
      id: 2,
      title: 'test 2'
    }, {
      id: 3,
      title: 'test 3'
    }];

    nagStore.registerKey('test', {
      method: 'GET',
      url: '/api/test'
    }, 100, {
      success: function(response) {
        return response.response.data;
      },
      error: function(response) {
        throw new Error(response.response.message);
      }
    });

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [500, {
        response: {
          status: 'error',
          message: 'Server Error'
        }
      }, {}];
    });
    nagStore.get('test');
    $httpBackend.flush();

    expect($exceptionHandler.errors.length).toBe(1);
    expect($exceptionHandler.errors[0].message).toBe('Server Error');

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [200, {
        response: {
          status: 'success',
          data: responseData
        }
      }, {}];
    });
    var test;

    nagStore.get('test').then(function(data) {
      test = data;
    });
    $httpBackend.flush();

    expect(test).toEqual(responseData);
  });
});
