describe('Store', function(){
  var nagStore, $timeout, $httpBackend, $exceptionHandler, $q, $rootScope;

  beforeEach(module('nag.store'));

  beforeEach(module(function($exceptionHandlerProvider) {
    $exceptionHandlerProvider.mode('log');
  }));

  beforeEach(inject(function($injector) {
    nagStore = $injector.get('nagStore');
    $timeout = $injector.get('$timeout');
    $httpBackend = $injector.get('$httpBackend');
    $exceptionHandler = $injector.get('$exceptionHandler');
    $rootScope = $injector.get('$rootScope');
    $q = $injector.get('$q');

    store.remove('test');
    store.remove('test2');
  }));

  afterEach(function() {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it("should be able to set/get data", function() {
    var value = 'test';

    nagStore.get('test').then(function(data) {
      value = data;
    });

    //need this in order to make sure the promise is resolved properly
    $rootScope.$digest();
    
    expect(value).to.be.undefined;

    nagStore.set('test', 'data');
    value = nagStore.get('test').then(function(data) {
      value = data;
    });

    //need this in order to make sure the promise is resolved properly
    $rootScope.$digest();

    expect(value).to.equal('data');
  });

  it("should be able to set/get data with an expire time", function(done) {
    nagStore.set('test', 'data', 100);

    setTimeout(function() {
      var value = 'test';

      nagStore.get('test').then(function(data) {
        value = data;
      });
      //need this in order to make sure the promise is resolved properly
      $rootScope.$digest();

      expect(value).to.be.undefined;
      done();
    }, 200);
  });

  it("should be able to remove data", function() {
    nagStore.set('test', 'data');
    nagStore.remove('test', 'data');

    var value = 'test';

    nagStore.get('test').then(function(data) {
      value = data;
    });
    //need this in order to make sure the promise is resolved properly
    $rootScope.$digest();

    expect(value).to.be.undefined;
  });

  it("should be able to configure a key with a remote resource", function() {
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
    var value;

    nagStore.get('test').then(function(data) {
      value = data;
    });
    //need this in order to make sure the promise is resolved properly
    $httpBackend.flush();

    expect(value).to.deep.equal(responseData);
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
    var value;
    nagStore.get('test').then(function(data) {
      value = data;
    });
    //this handles calling $digest on scope
    $httpBackend.flush();

    expect(value).to.deep.equal(responseData);
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
    var value;

    nagStore.get('test').then(function(data) {
      value = data;
    });
    //this handles calling $digest on scope
    $httpBackend.flush();

    //this second time should not trigger a request for the data
    value = null;

    nagStore.get('test').then(function(data) {
      value = data;
    });
    //this handles calling $digest on scope
    $rootScope.$digest();

    expect(value).to.deep.equal(responseData);
  });

  it("should refetch data automatically when registered key expires", function(done) {
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
    var value;
    nagStore.get('test').then(function(data) {
      value = data;
    });
    //this handles calling $digest on scope
    $httpBackend.flush();

    setTimeout(function() {
      $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
        return [200, {
          response: {
            status: 'success',
            data: responseData
          }
        }, {}];
      });
      var value;
      nagStore.get('test').then(function(data) {
        value = data;
      });
      //this handles calling $digest on scope
      $httpBackend.flush();

      expect(value).to.deep.equal(responseData);
      done();
    }, 200);
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
    var value;
    nagStore.get('test').then(function(data) {
      value = data;
    });
    //this handles calling $digest on scope
    $httpBackend.flush();

    expect($exceptionHandler.errors.length).to.equal(1);
    expect($exceptionHandler.errors[0].message).to.equal('Server Error');

    $httpBackend.expect('GET', '/api/test').respond(function(method, url, data) {
      return [200, {
        response: {
          status: 'success',
          data: responseData
        }
      }, {}];
    });

    nagStore.get('test').then(function(data) {
      value = data;
    });
    //this handles calling $digest on scope
    $httpBackend.flush();

    expect(value).to.deep.equal(responseData);
  });
});
