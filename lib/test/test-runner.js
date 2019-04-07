var EventEmitter = require('events');

class TestRunner extends EventEmitter {
  constructor(tests) {
    super();
    this.tests = tests;
    this.instances = null;
  }

  run() {
    this.instances = [];
    this.failures = [];

    return this.tests.reduce((chain, test) => {

      return chain.then(() => {

        try {
          return this._newTest(test).run();

        } catch (err) {
          this.failures.push(err);

          this.emit('test-error', test, err);
        }

      });

    }, Promise.resolve());
  }

  _newTest(testClass) {
    let inst = new testClass();

    this.instances.push(inst);
    this.emit('test-created', inst);

    return inst;
  }

  didPass() {
    return this.instances &&
      this.failures.length == 0 &&
      this.instances.reduce((flag, inst) => flag && inst.didSucceed(), true);
  }
}

module.exports = TestRunner;
