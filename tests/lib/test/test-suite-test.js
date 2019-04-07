require('../../../init');

var sinon = require('sinon')
  , chai = require('chai')
  , sinonChai = require('sinon-chai')
  , match = sinon.match
;

chai.use(sinonChai);

const MEMOIZE = {memoize: true};

function newSpy() { return sinon.spy(); }
function newResolveStub() { return sinon.stub().resolves(1); }
function newRejectStub()  { return sinon.stub().rejects(new Error('failure')); }

describe(TestSuite, () => {

  prop('subject', function() { return new this.describedClass(); });

  describe('.run()', () => {
    prop('testStartedListener',   newSpy, MEMOIZE);
    prop('testCompletedListener', newSpy, MEMOIZE);
    prop('testCreatedListener',   newSpy, MEMOIZE);
    prop('testErrorListener',     newSpy, MEMOIZE);

    prop('firstTestMethod',  newResolveStub, MEMOIZE);
    prop('secondTestMethod', newResolveStub, MEMOIZE);
    prop('failureMethod',    newRejectStub,  MEMOIZE);
    prop('testFunctions',    []);

    prop('beforeRunMethod',     newResolveStub, MEMOIZE);
    prop('afterRunMethod',      newResolveStub, MEMOIZE);
    prop('beforeTestRunMethod', newResolveStub, MEMOIZE);
    prop('afterTestRunMethod',  newResolveStub, MEMOIZE);

    prop('tests', function() {
      return this.testFunctions.map((f, i) => it(`test #${i}`, f));
    }, MEMOIZE);

    prop('subject', function() {
      class CustomTestSuite extends TestSuite {
      }
      CustomTestSuite.prototype.tests = () => this.tests;
      CustomTestSuite.prototype._beforeRun = this.beforeRunMethod;
      CustomTestSuite.prototype._afterRun = this.afterRunMethod;
      CustomTestSuite.prototype._beforeTestRun = this.beforeTestRunMethod;
      CustomTestSuite.prototype._afterTestRun = this.afterTestRunMethod;

      let subject = new CustomTestSuite();
      subject.addListener('test-started', this.testStartedListener);
      subject.addListener('test-completed', this.testCompletedListener);
      subject.addListener('test-created', this.testCreatedListener);
      subject.addListener('test-error', this.testErrorListener);

      return subject;
    }, MEMOIZE);

    before(function() { return this.subject.run(); });

    it('emits a test-started event before the suite', function() {
      expect(this.testStartedListener).to.have.been.calledWith(this.subject);
    });

    it('calls _beforeRun before the suite', function() {
      expect(this.beforeRunMethod).to.have.been.called;
    });

    it('emits a test-completed event at the end of the suite', function() {
      expect(this.testCompletedListener).to.have.been.calledWith(this.subject);
    });

    it('calls _afterRun at the end of the suite', function() {
      expect(this.afterRunMethod).to.have.been.called;
    });

    context('with no test cases', () => {
      it('succeeds', function() {
        expect(this.subject.didSucceed()).to.be.true;
      });
    });

    context('with multiple tests', () => {
      prop('testFunctions',
        function() { return [this.firstTestMethod, this.secondTestMethod]; });

      it('emits a test-created event for each test', function() {
        let listener = this.testCreatedListener;

        expect(listener).to.have.been.calledWith(match.instanceOf(this.tests[0]));
        expect(listener).to.have.been.calledWith(match.instanceOf(this.tests[1]));
      });

      it('calls _beforeTestRun before running each test', function() {
        expect(this.beforeTestRunMethod)
          .to.have.been.calledWith(match.instanceOf(this.tests[0]));

        expect(this.beforeTestRunMethod)
          .to.have.been.calledWith(match.instanceOf(this.tests[1]));
      });

      it('calls _afterTestRun after running each test', function() {
        expect(this.afterTestRunMethod)
          .to.have.been.calledWith(match.instanceOf(this.tests[0]));

        expect(this.afterTestRunMethod)
          .to.have.been.calledWith(match.instanceOf(this.tests[1]));
      });

      it('runs all tests', function() {
        this.testFunctions.forEach(fn => expect(fn).to.have.been.called)
      });

      context('with all tests succeeding', () => {
        it('runs all tests', function() {
          this.testFunctions.forEach(fn => expect(fn).to.have.been.called)
        });

        it('succeeds', function() {
          expect(this.subject.didSucceed()).to.be.true;
        });

        it('does not emit a test-error event', function() {
            expect(this.testErrorListener).to.not.have.been.called;
        });
      });

      context('with any tests not succeeding', () => {
        prop('testFunctions',
          function() { return [this.failureMethod, this.secondTestMethod]; });

        it('runs all tests', function() {
          this.testFunctions.forEach(fn => expect(fn).to.have.been.called);
        });

        it('does not succeed', function() {
          expect(this.subject.didSucceed()).to.be.false;
        });

        it('does not emit a test-error event', function() {
          expect(this.testErrorListener).to.not.have.been.called;
        });
      });

      context("with a test whose constructor throws", () => {
        prop('errorTest', function() {
          return class extends TestCase {
            constructor(c) { super(c); throw new Error('failure'); }
          };
        }, MEMOIZE);

        prop('tests', function() { return [
          this.errorTest,
          it("test #2", this.secondTestMethod)
        ]; }, MEMOIZE);

        it("emits a test-error event", function() {
          expect(this.testErrorListener)
            .to.have.been.calledWith(this.tests[0], match.instanceOf(Error))
        });

        it("runs subsequent tests", function() {
          expect(this.secondTestMethod).to.have.been.called;
        });

        it("does not succeed", function() {
          expect(this.subject.didSucceed()).to.be.false;
        });
      });

      context("with a container suite", () => {
        prop('innerSuite', function() {
          class InnerSuite extends TestSuite { }
          InnerSuite.prototype.tests = () => this.innerTests;

          return new InnerSuite(this.subject);
        }, MEMOIZE);

        prop('innerTests', function() { return [ it('runs', () => true) ]; }, MEMOIZE);

        before(function() { return this.innerSuite.run(); });

        it('calls _beforeTestRun on the container', function() {
          expect(this.beforeTestRunMethod)
            .to.have.been.calledWith(match.instanceOf(this.innerTests[0]));
        });

        it('calls _afterTestRun on the container', function() {
          expect(this.afterTestRunMethod)
            .to.have.been.calledWith(match.instanceOf(this.innerTests[0]));
        });
      });

      context('when _beforeRun rejects', () => {
        prop('beforeRunMethod', newRejectStub, MEMOIZE);

        it("emits a test-error event", function() {
          expect(this.testErrorListener)
            .to.have.been.calledWith(this.subject, match.instanceOf(Error))
        });

        it('does not run tests in the suite', function() {
          this.testFunctions.forEach(fn => expect(fn).to.not.have.been.called)
        });

        it('does not succeed', function() {
          expect(this.subject.didSucceed()).to.be.false;
        });
      });

      context('when _afterRun rejects', () => {
        prop('afterRunMethod', newRejectStub, MEMOIZE);

        it("emits a test-error event", function() {
          expect(this.testErrorListener)
            .to.have.been.calledWith(this.subject, match.instanceOf(Error))
        });
      });
    });
  });

  describe(".isSuite()", () => {
    it("returns true", function() {
      expect(this.subject.isSuite()).to.be.true;
    });
  });

});
