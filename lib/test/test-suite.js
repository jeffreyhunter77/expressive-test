var TestCase = require('./test-case')
  , prom = require('expressive-test-util').promise
;

class TestSuite extends TestCase {
  constructor(container) {
    super(container);
    this._instances = [];
    this._succeeded = false;
  }

  async run() {

    try {

      await this._prepareTestRun();
      await this._runEachTest();

    } catch (e) {
      this.emit('test-error', this, e)
      this._succeeded = false
    }

    try {
      await this._endTestRun();
    } catch (e) {
      this.emit('test-error', this, e);
    }

  }

  didSucceed() {
    return this._instances.reduce(
      (flag, test) => flag && test && (test.didSucceed() || test.isPending()),
      this._succeeded
    );
  }

  isSuite() { return true; }

  async _prepareTestRun() {
    this._instances = [];
    this._succeeded = true;

    this.emit('test-started', this);

    await this._beforeRun();
  }

  async _endTestRun() {
    this.emit('test-completed', this);

    await this._afterRun();
  }

  async _runEachTest() {
    await prom.promiseEach(this.tests(), async (test) => {

      let inst = false;

      try {

        inst = new test(this);
        this.emit('test-created', inst);

        this._instances.push(inst);

        await this._runTestInstance(inst);

      } catch (e) {
        this.emit('test-error', inst ? inst : test, e);

        if (inst)
          inst.complete();

        this._succeeded = false
      }

    });
  }

  async _runTestInstance(test) {
    await this._performBeforeTestRun(test);
    await test.run();
    await this._performAfterTestRun(test);
  }

  async _performBeforeTestRun(test) {
    if (this.container)
      await this.container._performBeforeTestRun(test)

    await this._beforeTestRun(test)
  }

  async _performAfterTestRun(test) {
    if (this.container)
      await this.container._performAfterTestRun(test);

    await this._afterTestRun(test);
  }

  async _beforeRun() { }

  async _afterRun() { }

  async _beforeTestRun(test) {  }

  async _afterTestRun(test) {  }
}

module.exports = TestSuite;
