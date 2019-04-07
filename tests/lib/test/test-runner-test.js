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

class TestRunnerTestSuite extends TestSuite {

  description() { return "TestRunner"; }

  tests() {
    class TestRunnerTestSuiteContext extends TestCase {
      get runner() { return this._runner = this._runner || new TestRunner(this.tests); }
      get passed() { return this.runner.didPass(); }
    };

    return [
      class extends TestRunnerTestSuiteContext {
        description() { return "runs all tests"; }

        get tests() { return [SyncTest, AsyncTest]; }

        _test() {
          return this.runner.run()
            .then(() => {
              expect(SyncTest.called).to.be.true;
              expect(AsyncTest.called).to.be.true;
            });
        }
      },

      class extends TestRunnerTestSuiteContext {
        description() { return "with succeeding tests it passes"; }

        get tests() { return [SyncTest, AsyncTest]; }

        _test() {
          return this.runner.run()
            .then(() => expect(this.passed).to.be.true);
        }
      },

      class extends TestSuite {
        description() { return "when a test constructor throws an exception"; }

        tests() {
          class TestRunnerCtorExceptionContext extends TestRunnerTestSuiteContext {
            get tests() { return [ConstructorErrorTest]; }
          }

          return [
            class extends TestRunnerCtorExceptionContext {
              description() { return "does not pass"; }

              _test() {
                return this.runner.run()
                  .then(() => expect(this.passed).to.be.false);
              }
            }
          ];
        }
      },

      class extends TestSuite {
        description() { return "when a test throws an exception"; }

        tests() {
          class TestRunnerExceptionContext extends TestRunnerTestSuiteContext {
            get tests() { return [ExceptionTest]; }
          }

          return [
            class extends TestRunnerExceptionContext {
              description() { return "does not pass"; }

              _test() {
                return this.runner.run()
                  .then(() => expect(this.passed).to.be.false);
              }
            }
          ];
        }
      },

      class extends TestSuite {
        description() { return "when a test fails"; }

        tests() {
          class TestRunnerFailureContext extends TestRunnerTestSuiteContext {
            get tests() { return [FailureTest, SyncTest]; }
          }

          return [
            class extends TestRunnerFailureContext {
              description() { return "does not pass"; }

              _test() {
                return this.runner.run()
                  .then(() => expect(this.passed).to.be.false);
              }
            }
          ];
        }
      }
    ];
  }

}

TestRegistry.add(TestRunnerTestSuite);
