var TestCase = require('./test-case')
  , prom = require('expressive-test-util').promise
;

class TestSuite extends TestCase {
  constructor(container) {
    super(container);
    this._instances = [];
    this._succeeded = false;
  }

  run() {
    return this._prepareTestRun()
      .then(() => this._runEachTest())
      .catch((e) => {
        this.emit('test-error', this, e)
        this._succeeded = false
      })
      .then(() => this._endTestRun())
      .catch((e) => this.emit('test-error', this, e));
  }

  didSucceed() {
    return this._instances.reduce(
      (flag, test) => flag && test && test.didSucceed(),
      this._succeeded
    );
  }

  isSuite() { return true; }

  _prepareTestRun() {
    this._instances = [];
    this._succeeded = true;

    this.emit('test-started', this);

    return Promise.resolve()
      .then(() => this._beforeRun());
  }

  _endTestRun() {
    this.emit('test-completed', this);

    return this._afterRun();
  }

  _runEachTest() {
    return prom.promiseEach(this.tests(), (test) => {

      return Promise.resolve()
        .then(() => {
          let inst = new test(this);
          this.emit('test-created', inst);
          return inst;
        })

        .catch((e) => {
          this.emit('test-error', test, e);
          return false;
        })

        .then((inst) => {
          this._instances.push(inst);
          if(inst) return this._runTestInstance(inst);
        });

    });
  }

  _runTestInstance(test) {
    return Promise.resolve()
      .then(() => this._performBeforeTestRun(test))
      .then(() => test.run())
      .then(() => this._performAfterTestRun(test))
  }

  _performBeforeTestRun(test) {
    return Promise.resolve()
      .then(() => {
        if (this.container)
          return this.container._performBeforeTestRun(test)
      })
      .then(() => {
        return this._beforeTestRun(test)
      });
  }

  _performAfterTestRun(test) {
    return Promise.resolve()
      .then(() => {
        if (this.container)
          return this.container._performAfterTestRun(test)
      })
      .then(() => {
        return this._afterTestRun(test)
      });
  }

  _beforeRun() { }

  _afterRun() { }

  _beforeTestRun(test) {  }

  _afterTestRun(test) {  }
}

module.exports = TestSuite;
