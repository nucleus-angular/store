/**
 * A service the wraps the store.js functionality and adds in support for "expiring" data
 */
angular.module('nag.store', [])
.factory('nagStore', [function() {
  return {
    get: function(key) {
      var now = (new Date()).getTime();
      var storedData = store.get(key);

      if(storedData && storedData.expires && storedData.expires <= now) {
        //make sure the data is removed from the store
        store.remove(key);

        //return undefined as if the data was not in the store
        storedData = undefined;
      } else if(storedData) {
        storedData = storedData.value;
      }

      return storedData;
    },

    set: function(key, value, expire) {
      //determine expires
      var expires = (new Date()).getTime();
      expires = (expire ? expires + expire : false);
      var data = {
        value: value,
        expires: expires
      }

      return store.set(key, data);
    },

    remove: function(key) {
      store.remove(key);
    }
  }
}]);
