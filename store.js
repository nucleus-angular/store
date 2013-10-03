/**
 * # Store
 *
 * A service the wraps the store.js functionality and adds in support for "expiring" data.
 *
 * EXAMPLE TODO
 *
 * @module nag.store.nagStore
 * @ngservice nagStore
 */
angular.module('nag.store', [])
.factory('nagStore', [
  '$http',
  '$q',
  function($http, $q) {
    var registeredKeys = {};

    /**
     * Saves data to local storage
     *
     * @method set
     *
     * @param {string} key Key of the data to set
     * @param {mixed} value Value of the data to store
     * @param {number} [expireIn] Number of millisecond to have the value stay value
     *
     * @return {mixed}
     */
    var setFunction = function(key, value, expireIn) {
      //determine expires
      var expires = (new Date()).getTime();
      expires = (expireIn ? expires + expireIn : false);
      var data = {
        value: value,
        expires: expires
      }

      return store.set(key, data);
    };

    return {
      /**
       * Returns data from local storage
       *
       * @method get
       *
       * @param {string} key Key of the data to retrieve
       *
       * @return {mixed|Promise} Either the data or a promised for a registered key
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
        if((storedData === undefined || storedData === null) && registeredKeys[key]) {
          var remoteResource = registeredKeys[key];
          var deferred = $q.defer();

          $http(remoteResource.httpOptions)
          .success(function(response) {
            var data = remoteResource.responseParsers.success(response);
            setFunction(key, data, remoteResource.expireIn);
            deferred.resolve(data);
          })
          .error(function(response) {
            remoteResource.responseParsers.error(response);
            deferred.reject('Error processed registered key (' + key + ')');
          });

          storedData = deferred.promise;
        }

        return storedData;
      },

      set: setFunction,

      /**
       * Removes data from the local storage
       *
       * @method remove
       *
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
       * @param {string} key Key to registered with a remote resource
       * @param {string|object}httpOptions Either the url or the remote resource of an object of options for a $http request
       * @param {number} expireIn Number of millisecond to have the value stay value
       * @param {function|object} responseParser Either a success function or an object with a function for success and error
       */
      registerKey: function(key, httpOptions, expireIn, responseParsers) {
        if(_.isString(httpOptions)) {
          httpOptions = {
            method: 'GET',
            url: httpOptions
          }
        }

        if(responseParsers) {
          if(_.isFunction(responseParsers)) {
            responseParsers = {
              success: responseParsers,
              error: function(){}
            };
          }
        } else {
          responseParsers = {
            success: function(){},
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
