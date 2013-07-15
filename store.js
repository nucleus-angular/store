/**
 * A service the wraps the store.js functionality and adds in support for "expiring" data
 *
 * @class nag.store.nagStore
 */
angular.module('nag.store', [])
.factory('nagStore', [
  '$http',
  '$q',
  function($http, $q) {
    var registeredKeys = {};

    return {
      /**
       * Returns data from local storage
       *
       * @method get
       *
       * @param key
       * @returns {*|Promise}
       */
      get: function(key) {
        var now = (new Date()).getTime();
        var storedData = store.get(key);

        if(storedData && storedData.expires && storedData.expires <= now) {
          //make sure the data is removed from the store
          store.remove(key);
          storedData = undefined;
        } else if(storedData) {
          storedData = storedData.value;
        }

        //check to see if the key is registered with a remote resource if no data has been found
        //console.log(registeredKeys[key]);
        if((storedData === undefined || storedData === null) && registeredKeys[key]) {
          var remoteResource = registeredKeys[key];
          var deferred = $q.defer();

          $http(remoteResource.httpOptions)
          .success(function(response) {
            deferred.resolve(remoteResource.responseParsers.success(response));
          })
          .error(function(response) {
            remoteResource.responseParsers.error(response);
            deferred.reject('Error processed registered key (' + key + ')');
          });

          storedData = deferred.promise;
        }

        return storedData;
      },

      /**
       * Saves data to local storage
       *
       * @method set
       *
       * @param key
       * @param value
       * @param expireIn
       * @returns {*}
       */
      set: function(key, value, expireIn) {
        //determine expires
        var expires = (new Date()).getTime();
        expires = (expireIn ? expires + expireIn : false);
        var data = {
          value: value,
          expires: expires
        }

        return store.set(key, data);
      },

      /**
       * Removes data from the local storage
       * @param key
       */
      remove: function(key) {
        store.remove(key);
      },

      /**
       * Registers a key with a remote resource
       *
       * @method registerKey
       *
       * @param key
       * @param httpOptions
       * @param responseParser
       * @param expireIn
       */
      registerKey: function(key, httpOptions, responseParsers, expireIn) {
        if(_.isString(httpOptions)) {
          httpOptions = {
            method: 'GET',
            url: httpOptions
          }
        }

        if(_.isFunction(responseParsers)) {
          responseParsers = {
            success: responseParsers,
            error: function(){}
          };
        }

        registeredKeys[key] = {
          httpOptions: httpOptions,
          responseParsers: responseParsers,
          expireIn: expireIn
        };
      }
    }
  }
]);
