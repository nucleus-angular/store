describe('Store', function(){
  var nagStore, $timeout;

  beforeEach(module('nag.store'));

  beforeEach(inject(function($injector) {
    nagStore = $injector.get('nagStore');
    $timeout = $injector.get('$timeout');

    store.remove('test');
  }));

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
});
