angular.module('unitTestMocker', [])
.service('unitTestMocker', ['$httpBackend', function($httpBackend) {
  /*this.setInvalidLoadSessionResponse = function() {
    var httpResponseCode = 200;
    $httpBackend.when('GET', '/api/session').respond(function(method, url, data) {
      return [httpResponseCode, {
        response: {
          status: 'success',
          data: null
        }
      }, {}];
    });
  };*/

  this.flush = function() {
    $httpBackend.flush();
  };
}])

