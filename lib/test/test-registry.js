var prom = require('expressive-test-util').promise
;

class TestRegistry {

  constructor() {
    this._tests = [];
    this._beforeHooks = [];
    this._afterHooks = [];
  }

  add(testClass) {
    this._tests.push(testClass);
  }

  tests() {
    return this._tests;
  }

  beforeAnything(callback) {
    this._beforeHooks.push(callback);
  }

  afterEverything(callback) {
    this._afterHooks.push(callback);
  }

  setup() {
    return prom.promiseEach(this._beforeHooks, hook => hook());
  }

  teardown() {
    return prom.promiseEach(this._afterHooks, hook => hook());
  }

}

const globalRegistry = new TestRegistry();

module.exports = globalRegistry;
