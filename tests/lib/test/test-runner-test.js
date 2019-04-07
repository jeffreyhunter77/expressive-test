require('../../../init');

var TestRunner = require('../../../lib/test/test-runner');

class SyncTest extends TestCase {
  constructor(container) { super(container); SyncTest.called = false; }
  _test() { SyncTest.called = true; }
}

class AsyncTest extends TestCase {
  constructor(container) { super(container); AsyncTest.called = false; }
  _test() {
    return new Promise(resolve => process.nextTick(resolve))
      .then(() => AsyncTest.called = true)
  }
}

class ConstructorErrorTest extends TestCase {
  constructor(container) { super(container); throw new Error("constructor failure"); }
  _test() { }
}

class ExceptionTest extends TestCase {
  _test() { throw new Error("test failure"); }
}

class FailureTest extends TestCase {
  _test() { }
  didSucceed() { return false; }
}

describe("TestRunner", () => {

  prop('passed', function() { return this.runner.didPass(); });
  prop('runner', function() { return new TestRunner(this.tests); }, {memoize: true});

  context("with one or more tests", () => {

    prop('tests', [SyncTest, AsyncTest]);

    before(function() { return this.runner.run(); });

    it("runs all tests", function() {
      expect(SyncTest.called).to.be.true;
      expect(AsyncTest.called).to.be.true;
    });


    context("when all tests succeed", () => {

      it("passes", function() {
        expect(this.passed).to.be.true;
      });

    });

    context("when a test constructor throws an exception", () => {

      prop('tests', [ConstructorErrorTest]);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test throws an exception", () => {

      prop('tests', [ExceptionTest]);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

    context("when a test fails", () => {

      prop('tests', [FailureTest]);

      it("does not pass", function() {
        expect(this.passed).to.be.false;
      });

    });

  });

});
